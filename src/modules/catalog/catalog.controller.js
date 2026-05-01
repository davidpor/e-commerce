// src/modules/catalog/catalog.controller.js
const service = require('./catalog.service');

// ── Categorías ─────────────────────────────────────────────────────────────
const getCategorias = async (req, res, next) => {
  try {
    const categorias = await service.getCategorias();
    res.json({ categorias });
  } catch (e) { next(e); }
};

const crearCategoria = async (req, res, next) => {
  try {
    const categoria = await service.crearCategoria(req.body);
    res.status(201).json({ categoria });
  } catch (e) { next(e); }
};

// ── Productos ──────────────────────────────────────────────────────────────
const getProductos = async (req, res, next) => {
  try {
    // req.query contiene los filtros de la URL:
    // GET /api/products?buscar=tornillo&categoria_id=3&page=2
    const resultado = await service.getProductos(req.query);
    res.json(resultado);
  } catch (e) { next(e); }
};

const getProductoPorId = async (req, res, next) => {
  try {
    const producto = await service.getProductoPorId(req.params.id);
    res.json({ producto });
  } catch (e) { next(e); }
};

const getProductoPorSlug = async (req, res, next) => {
  try {
    const producto = await service.getProductoPorSlug(req.params.slug);
    res.json({ producto });
  } catch (e) { next(e); }
};

const crearProducto = async (req, res, next) => {
  try {
    const producto = await service.crearProducto(req.body);
    res.status(201).json({ producto });
  } catch (e) { next(e); }
};

const actualizarProducto = async (req, res, next) => {
  try {
    const producto = await service.actualizarProducto(req.params.id, req.body);
    res.json({ producto });
  } catch (e) { next(e); }
};

const eliminarProducto = async (req, res, next) => {
  try {
    const resultado = await service.eliminarProducto(req.params.id);
    res.json(resultado);
  } catch (e) { next(e); }
};

const actualizarStock = async (req, res, next) => {
  try {
    const { cantidad, operacion } = req.body;
    const resultado = await service.actualizarStock(
      req.params.id, 
      parseInt(cantidad), 
      operacion
    );
    res.json(resultado);
  } catch (e) { next(e); }
};

module.exports = {
  getCategorias, crearCategoria,
  getProductos, getProductoPorId, getProductoPorSlug,
  crearProducto, actualizarProducto, eliminarProducto,
  actualizarStock,
};