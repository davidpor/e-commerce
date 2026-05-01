// src/modules/catalog/catalog.router.js
const { Router } = require('express');
const ctrl = require('./catalog.controller');
const { autenticar, autorizar } = require('../../middlewares/auth.middleware');

const router = Router();

// ── Categorías ─────────────────────────────────────────────────────────────

// GET: cualquier usuario logueado puede ver las categorías
router.get('/categories', autenticar, ctrl.getCategorias);

// POST: solo admin puede crear categorías
router.post('/categories', autenticar, autorizar('admin'), ctrl.crearCategoria);

// ── Productos ──────────────────────────────────────────────────────────────

// GET: listar productos con filtros (todos los roles)
router.get('/', autenticar, ctrl.getProductos);

// GET: buscar por slug (para páginas de detalle en el frontend)
router.get('/slug/:slug', autenticar, ctrl.getProductoPorSlug);

// GET: detalle por ID
router.get('/:id', autenticar, ctrl.getProductoPorId);

// POST: solo admin puede crear productos
router.post('/', autenticar, autorizar('admin'), ctrl.crearProducto);

// PUT: admin y vendedor pueden actualizar
router.put('/:id', autenticar, autorizar('admin', 'vendedor'), ctrl.actualizarProducto);

// DELETE: solo admin (soft delete)
router.delete('/:id', autenticar, autorizar('admin'), ctrl.eliminarProducto);

// PATCH: actualizar stock (admin y vendedor)
router.patch('/:id/stock', autenticar, autorizar('admin', 'vendedor'), ctrl.actualizarStock);

module.exports = router;