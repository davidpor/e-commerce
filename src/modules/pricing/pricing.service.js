// src/modules/pricing/pricing.service.js
const { PriceList, PriceListItem } = require('./pricing.model');
const Product  = require('../catalog/product.model');
const Company  = require('../users/company.model');
const { errors } = require('../../utils/errors');

// ── Función clave del sistema B2B ──────────────────────────────────────────
// Dado un producto y una empresa, calcula el precio final que esa empresa paga.
// Esta función es la que llaman los módulos de cotización y pedidos.
const calcularPrecio = async (productId, companyId, cantidad = 1) => {
  const producto = await Product.findByPk(productId);
  if (!producto) throw errors.notFound('Producto');

  const empresa = await Company.findByPk(companyId);

  // Si la empresa no tiene lista asignada, usamos el precio base del producto
  if (!empresa || !empresa.price_list_id) {
    return {
      precio_unitario:  parseFloat(producto.precio_lista),
      descuento_aplicado: 0,
      precio_final:     parseFloat(producto.precio_lista),
      cantidad,
      subtotal: parseFloat(producto.precio_lista) * cantidad,
      origen: 'precio_base',
    };
  }

  const lista = await PriceList.findByPk(empresa.price_list_id);
  if (!lista || !lista.activa) {
    // Lista inactiva: caemos al precio base
    return {
      precio_unitario:   parseFloat(producto.precio_lista),
      descuento_aplicado: 0,
      precio_final:      parseFloat(producto.precio_lista),
      cantidad,
      subtotal: parseFloat(producto.precio_lista) * cantidad,
      origen: 'precio_base',
    };
  }

  // Buscamos si hay un precio específico para este producto en esta lista
  const itemLista = await PriceListItem.findOne({
    where: {
      price_list_id: lista.id,
      product_id:    productId,
      activo:        true,
    },
  });

  let precioBase;
  let origen;

  if (itemLista) {
    // Hay precio específico para este producto → lo usamos
    precioBase = parseFloat(itemLista.precio);
    origen     = 'precio_lista_especifico';

    // Verificamos si aplica algún descuento por volumen
    const descuentosVolumen = itemLista.descuentos_volumen || [];
    
    // Ordenamos de mayor a menor cantidad para encontrar el mayor descuento aplicable
    const descuentosOrdenados = [...descuentosVolumen].sort(
      (a, b) => b.cantidad - a.cantidad
    );

    // Buscamos el primer escalón de descuento que aplica según la cantidad
    const descuentoVolumen = descuentosOrdenados.find(
      d => cantidad >= d.cantidad
    );

    if (descuentoVolumen) {
      const pct          = descuentoVolumen.descuento / 100;
      const precioFinal  = precioBase * (1 - pct);
      return {
        precio_unitario:    precioBase,
        descuento_aplicado: descuentoVolumen.descuento,
        precio_final:       Math.round(precioFinal * 100) / 100,
        cantidad,
        subtotal: Math.round(precioFinal * cantidad * 100) / 100,
        origen: 'descuento_volumen',
      };
    }

  } else {
    // No hay precio específico → aplicamos descuento_global de la lista
    // sobre el precio_lista base del producto
    const pct      = parseFloat(lista.descuento_global) / 100;
    precioBase     = parseFloat(producto.precio_lista) * (1 - pct);
    origen         = 'descuento_global_lista';
  }

  // También aplicamos el descuento_base negociado con la empresa
  // (se acumula sobre el precio ya calculado)
  let precioFinal = precioBase;
  if (empresa.descuento_base > 0) {
    const pctEmpresa = parseFloat(empresa.descuento_base) / 100;
    precioFinal      = precioBase * (1 - pctEmpresa);
    origen           = `${origen}+descuento_empresa`;
  }

  precioFinal = Math.round(precioFinal * 100) / 100;

  return {
    precio_unitario:    parseFloat(producto.precio_lista), // precio de referencia
    precio_con_lista:   Math.round(precioBase * 100) / 100,
    descuento_aplicado: parseFloat(empresa.descuento_base),
    precio_final:       precioFinal,
    cantidad,
    subtotal: Math.round(precioFinal * cantidad * 100) / 100,
    origen,
  };
};

// ── CRUD de listas ─────────────────────────────────────────────────────────

const getListas = async () => {
  return PriceList.findAll({
    where: { activa: true },
    include: [{
      model: PriceListItem,
      as: 'items',
      required: false,
      attributes: ['id', 'product_id', 'precio'],
    }],
    order: [['nombre', 'ASC']],
  });
};

const getListaPorId = async (id) => {
  const lista = await PriceList.findOne({
    where: { id, activa: true },
    include: [{
      model: PriceListItem,
      as: 'items',
      include: [{
        model: Product,
        as: 'producto',
        attributes: ['id', 'sku', 'nombre', 'precio_lista'],
      }],
    }],
  });
  if (!lista) throw errors.notFound('Lista de precios');
  return lista;
};

const crearLista = async (data) => {
  const existe = await PriceList.findOne({ where: { nombre: data.nombre } });
  if (existe) throw errors.conflict('Ya existe una lista con ese nombre');
  return PriceList.create(data);
};

const actualizarLista = async (id, data) => {
  const lista = await PriceList.findByPk(id);
  if (!lista) throw errors.notFound('Lista de precios');
  await lista.update(data);
  return lista;
};

// ── CRUD de ítems (precios por producto) ──────────────────────────────────

const agregarOActualizarItem = async (listId, data) => {
  const lista    = await PriceList.findByPk(listId);
  if (!lista) throw errors.notFound('Lista de precios');

  const producto = await Product.findByPk(data.product_id);
  if (!producto) throw errors.notFound('Producto');

  // upsert: crea el registro si no existe, lo actualiza si ya existe
  const [item, creado] = await PriceListItem.findOrCreate({
    where: { price_list_id: listId, product_id: data.product_id },
    defaults: { ...data, price_list_id: listId },
  });

  if (!creado) await item.update(data);

  return { item, creado };
};

const eliminarItem = async (listId, itemId) => {
  const item = await PriceListItem.findOne({
    where: { id: itemId, price_list_id: listId },
  });
  if (!item) throw errors.notFound('Ítem de lista');
  await item.update({ activo: false });
  return { mensaje: 'Precio eliminado de la lista' };
};

// Asigna una lista de precios a una empresa
const asignarListaAEmpresa = async (companyId, priceListId) => {
  const lista = await PriceList.findByPk(priceListId);
  if (!lista) throw errors.notFound('Lista de precios');

  await Company.update(
    { price_list_id: priceListId },
    { where: { id: companyId } }
  );

  return { mensaje: `Lista "${lista.nombre}" asignada correctamente` };
};

// Devuelve el catálogo completo con precios calculados para una empresa
const getCatalogoConPrecios = async (companyId, query = {}) => {
  const { Op } = require('sequelize');
  const where  = { activo: true };

  if (query.buscar) {
    where[Op.or] = [
      { nombre: { [Op.like]: `%${query.buscar}%` } },
      { sku:    { [Op.like]: `%${query.buscar}%` } },
    ];
  }

  const productos = await Product.findAll({ where });

  // Calculamos el precio para cada producto según la empresa
  const catalogo = await Promise.all(
    productos.map(async (p) => {
      const precio = await calcularPrecio(p.id, companyId, 1);
      return {
        id:               p.id,
        sku:              p.sku,
        nombre:           p.nombre,
        marca:            p.marca,
        unidad_venta:     p.unidad_venta,
        cantidad_minima:  p.cantidad_minima,
        stock_actual:     p.stock_actual,
        precio_lista:     parseFloat(p.precio_lista), // precio de referencia
        precio_cliente:   precio.precio_final,         // precio real para esta empresa
        descuento:        precio.descuento_aplicado,
      };
    })
  );

  return catalogo;
};

module.exports = {
  calcularPrecio,
  getListas,
  getListaPorId,
  crearLista,
  actualizarLista,
  agregarOActualizarItem,
  eliminarItem,
  asignarListaAEmpresa,
  getCatalogoConPrecios,
};