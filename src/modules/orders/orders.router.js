// src/modules/orders/orders.router.js
const { Router } = require('express');
const ctrl = require('./orders.controller');
const { autenticar, autorizar } = require('../../middlewares/auth.middleware');

const router = Router();

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Listar pedidos
 *     tags: [Pedidos]
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [confirmado, en_preparacion, despachado, entregado, cancelado]
 *     responses:
 *       200: { description: Lista de pedidos }
 *
 * /api/orders/from-quote/{quoteId}:
 *   post:
 *     summary: Crear pedido desde cotización aprobada
 *     tags: [Pedidos]
 *     parameters:
 *       - in: path
 *         name: quoteId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       201: { description: Pedido creado }
 *
 * /api/orders/{id}/prepare:
 *   patch:
 *     summary: Iniciar preparación del pedido
 *     tags: [Pedidos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Estado actualizado }
 *
 * /api/orders/{id}/dispatch:
 *   patch:
 *     summary: Marcar pedido como despachado
 *     tags: [Pedidos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Pedido despachado }
 *
 * /api/orders/{id}/deliver:
 *   patch:
 *     summary: Confirmar entrega del pedido
 *     tags: [Pedidos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Pedido entregado }
 *
 * /api/orders/{id}/cancel:
 *   patch:
 *     summary: Cancelar pedido
 *     tags: [Pedidos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Pedido cancelado }
 */

// Listar y ver pedidos (todos los roles, filtrado por empresa en el servicio)
router.get('/',    autenticar, ctrl.getPedidos);
router.get('/:id', autenticar, ctrl.getPedidoPorId);

// Crear pedido desde cotización aprobada (cliente o admin)
router.post('/from-quote/:quoteId', autenticar, ctrl.crearDesdeCotizacion);

// Cambios de estado (solo vendedor y admin)
router.patch('/:id/prepare',  autenticar, autorizar('admin', 'vendedor'), ctrl.iniciarPreparacion);
router.patch('/:id/dispatch', autenticar, autorizar('admin', 'vendedor'), ctrl.marcarDespachado);
router.patch('/:id/deliver',  autenticar, autorizar('admin', 'vendedor'), ctrl.marcarEntregado);
router.patch('/:id/cancel',   autenticar, ctrl.cancelarPedido);

// Actualizar datos administrativos (remito, factura, notas)
router.put('/:id', autenticar, autorizar('admin', 'vendedor'), ctrl.actualizarPedido);

module.exports = router;