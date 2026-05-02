// src/modules/payments/payments.router.js
const { Router } = require('express');
const ctrl = require('./payments.controller');
const { autenticar } = require('../../middlewares/auth.middleware');

const router = Router();

/**
 * @swagger
 * /api/payments/orders/{orderId}/preference:
 *   post:
 *     summary: Crear preferencia de pago en Mercado Pago
 *     tags: [Pagos]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: URL de pago generada }
 *
 * /api/payments/orders/{orderId}/status:
 *   get:
 *     summary: Consultar estado de pago de un pedido
 *     tags: [Pagos]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Estado del pago }
 *
 * /api/payments/webhook:
 *   post:
 *     summary: Webhook de Mercado Pago (uso interno)
 *     tags: [Pagos]
 *     security: []
 *     responses:
 *       200: { description: Notificación recibida }
 */

// Crear preferencia de pago para un pedido
// El cliente hace click en "Pagar con Mercado Pago" → llama a este endpoint
router.post('/orders/:orderId/preference', autenticar, ctrl.crearPreferencia);

// Consultar estado de pago de un pedido
router.get('/orders/:orderId/status', autenticar, ctrl.getEstadoPago);

// Webhook de Mercado Pago — SIN autenticación JWT
// MP llama a esta URL desde sus servidores
router.post('/webhook', ctrl.webhook);

module.exports = router;