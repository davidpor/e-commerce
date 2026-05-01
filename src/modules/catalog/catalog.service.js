// src/modules/catalog/catalog.service.js
const { Op } = require('sequelize');
const Product  = require('./product.model');
const Category = require('./category.model');
const { errors } = require('../../utils/errors');
const { getPagination, getPaginationMeta } = require('../../utils/pagination');

// ── Función privada: genera slug a partir de un texto ──────────────────────
// "Tornillo M8 Zincado" → "tornillo-m8-zincado"
const generarSlug = (texto) =>
  texto
    .toLowerCase()
    .normalize('NFD')                    // separa letras de sus acentos
    .replace(/[\u0300-\u036f]/g, '')    // elimina los acentos
    .replace(/[^a-z0-9\s-]/g, '')      // elimina caracteres especiales
    .trim()
    .replace(/\s+/g, '-');             // espacios → guiones

// ══════════════════════════════════════════════════════════════════════════════
// CATEGORÍAS
// ══════════════════════════════════════════════════════════════════════════════

const getCategorias = async () => {
  return Category.findAll({
    where: { activa: true },
    order: [['orden', 'ASC'], ['nombre', 'ASC']],
    // Incluimos cuántos productos tiene cada categoría
    include: [{
      model: Product,
      as: 'productos',
      where: { activo: true },
      required: false,   // LEFT JOIN: muestra categorías aunque tengan 0 productos
      attributes: [],    // no traemos datos de productos, solo contamos
    }],
  });
};

const crearCategoria = async (data) => {
  const slug = generarSlug(data.nombre);

  // Verificamos que no exista una categoría con ese nombre o slug
  const existe = await Category.findOne({
    where: { [Op.or]: [{ nombre: data.nombre }, { slug }] }
  });
  if (existe) throw errors.conflict('Ya existe una categoría con ese nombre');

  return Category.create({ ...data, slug });
};

// ══════════════════════════════════════════════════════════════════════════════
// PRODUCTOS
// ══════════════════════════════════════════════════════════════════════════════

const getProductos = async (query) => {
  const { page, limit, offset } = getPagination(query);

  // Construimos el filtro dinámicamente según los parámetros recibidos
  const where = { activo: true };

  // Búsqueda por texto: busca en nombre, SKU y descripción
  if (query.buscar) {
    where[Op.or] = [
      { nombre:      { [Op.like]: `%${query.buscar}%` } },
      { sku:         { [Op.like]: `%${query.buscar}%` } },
      { descripcion: { [Op.like]: `%${query.buscar}%` } },
      { marca:       { [Op.like]: `%${query.buscar}%` } },
    ];
  }

  // Filtro por categoría
  if (query.categoria_id) {
    where.category_id = query.categoria_id;
  }

  // Filtro por marca
  if (query.marca) {
    where.marca = { [Op.like]: `%${query.marca}%` };
  }

  // Filtro solo productos destacados
  if (query.destacados === 'true') {
    where.destacado = true;
  }

  // Filtro por rango de precio
  if (query.precio_min || query.precio_max) {
    where.precio_lista = {};
    if (query.precio_min) where.precio_lista[Op.gte] = parseFloat(query.precio_min);
    if (query.precio_max) where.precio_lista[Op.lte] = parseFloat(query.precio_max);
  }

  // Filtro: solo con stock disponible
  if (query.con_stock === 'true') {
    where.stock_actual = { [Op.gt]: 0 };
  }

  // Ordenamiento
  const ordenesValidos = {
    'nombre_asc':   ['nombre', 'ASC'],
    'nombre_desc':  ['nombre', 'DESC'],
    'precio_asc':   ['precio_lista', 'ASC'],
    'precio_desc':  ['precio_lista', 'DESC'],
    'recientes':    ['created_at', 'DESC'],
  };
  const orden = ordenesValidos[query.orden] || ['nombre', 'ASC'];

  const { count, rows } = await Product.findAndCountAll({
    where,
    include: [{ model: Category, as: 'categoria', attributes: ['id', 'nombre', 'slug'] }],
    order: [orden],
    limit,
    offset,
  });

  return {
    productos: rows,
    paginacion: getPaginationMeta(count, page, limit),
  };
};

const getProductoPorId = async (id) => {
  const producto = await Product.findOne({
    where: { id, activo: true },
    include: [{ model: Category, as: 'categoria' }],
  });
  if (!producto) throw errors.notFound('Producto');
  return producto;
};

const getProductoPorSlug = async (slug) => {
  const producto = await Product.findOne({
    where: { slug, activo: true },
    include: [{ model: Category, as: 'categoria' }],
  });
  if (!producto) throw errors.notFound('Producto');
  return producto;
};

const crearProducto = async (data) => {
  // Verificamos que el SKU no exista
  const skuExiste = await Product.findOne({ 
    where: { sku: data.sku.toUpperCase() } 
  });
  if (skuExiste) throw errors.conflict(`Ya existe un producto con el SKU ${data.sku}`);

  const slug = generarSlug(data.nombre);

  // Si el slug ya existe, le agregamos el SKU para hacerlo único
  const slugExiste = await Product.findOne({ where: { slug } });
  const slugFinal  = slugExiste ? `${slug}-${data.sku.toLowerCase()}` : slug;

  return Product.create({ ...data, slug: slugFinal });
};

const actualizarProducto = async (id, data) => {
  const producto = await Product.findByPk(id);
  if (!producto) throw errors.notFound('Producto');

  // Si cambia el nombre, regeneramos el slug
  if (data.nombre && data.nombre !== producto.nombre) {
    data.slug = generarSlug(data.nombre);
  }

  await producto.update(data);
  return producto.reload({ include: [{ model: Category, as: 'categoria' }] });
};

const eliminarProducto = async (id) => {
  const producto = await Product.findByPk(id);
  if (!producto) throw errors.notFound('Producto');

  // Soft delete: marcamos como inactivo en vez de borrar
  // Así conservamos el historial de pedidos que referencian este producto
  await producto.update({ activo: false });
  return { mensaje: 'Producto desactivado correctamente' };
};

const actualizarStock = async (id, cantidad, operacion) => {
  const producto = await Product.findByPk(id);
  if (!producto) throw errors.notFound('Producto');

  let nuevoStock;
  if (operacion === 'sumar') {
    nuevoStock = producto.stock_actual + cantidad;
  } else if (operacion === 'restar') {
    nuevoStock = producto.stock_actual - cantidad;
    if (nuevoStock < 0) throw errors.badRequest('Stock insuficiente');
  } else {
    // 'reemplazar': setea el stock directamente
    nuevoStock = cantidad;
  }

  await producto.update({ stock_actual: nuevoStock });

  // Advertencia si quedó por debajo del mínimo
  const alerta = nuevoStock <= producto.stock_minimo 
    ? `⚠️ Stock bajo: quedan ${nuevoStock} unidades (mínimo: ${producto.stock_minimo})`
    : null;

  return { producto, alerta };
};

module.exports = {
  getCategorias,
  crearCategoria,
  getProductos,
  getProductoPorId,
  getProductoPorSlug,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  actualizarStock,
};