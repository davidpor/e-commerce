// src/modules/catalog/catalog.router.js
const { Router }   = require('express');
const ctrl         = require('./catalog.controller');
const { autenticar, autorizar } = require('../../middlewares/auth.middleware');
const upload       = require('../../middlewares/upload.middleware');

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

router.get('/categories',  autenticar, ctrl.getCategorias);
router.post('/categories', autenticar, autorizar('admin'), ctrl.crearCategoria);

router.get('/',         autenticar, ctrl.getProductos);
router.get('/slug/:slug', autenticar, ctrl.getProductoPorSlug);
router.get('/:id',      autenticar, ctrl.getProductoPorId);

// Usamos upload.single('imagen') para aceptar un archivo con el campo 'imagen'
router.post('/',   autenticar, autorizar('admin'),
  upload.single('imagen'), ctrl.crearProducto);

router.put('/:id', autenticar, autorizar('admin', 'vendedor'),
  upload.single('imagen'), ctrl.actualizarProducto);

router.delete('/:id',       autenticar, autorizar('admin'), ctrl.eliminarProducto);
router.patch('/:id/stock',  autenticar, autorizar('admin', 'vendedor'), ctrl.actualizarStock);

module.exports = router;