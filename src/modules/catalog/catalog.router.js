// src/modules/catalog/catalog.router.js
const { Router } = require('express');
const ctrl = require('./catalog.controller');
const { autenticar, autorizar } = require('../../middlewares/auth.middleware');

const router = Router();

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Listar productos con filtros
 *     tags: [Catálogo]
 *     parameters:
 *       - in: query
 *         name: buscar
 *         schema: { type: string }
 *         description: Busca en nombre, SKU y descripción
 *       - in: query
 *         name: categoria_id
 *         schema: { type: integer }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: Lista de productos con paginación }
 *
 * /api/products/{id}:
 *   get:
 *     summary: Obtener producto por ID
 *     tags: [Catálogo]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Detalle del producto }
 *       404: { description: Producto no encontrado }
 *   put:
 *     summary: Actualizar producto
 *     tags: [Catálogo]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Producto actualizado }
 *   delete:
 *     summary: Desactivar producto
 *     tags: [Catálogo]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Producto desactivado }
 *
 * /api/products/categories:
 *   get:
 *     summary: Listar categorías activas
 *     tags: [Catálogo]
 *     responses:
 *       200: { description: Lista de categorías }
 */

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