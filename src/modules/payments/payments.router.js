// src/modules/payments/payments.router.js
const { Router } = require('express');
const ctrl = require('./payments.controller');
const { autenticar } = require('../../middlewares/auth.middleware');

const router = Router();

// Crear preferencia de pago para un pedido
// El cliente hace click en "Pagar con Mercado Pago" → llama a este endpoint
router.post('/orders/:orderId/preference', autenticar, ctrl.crearPreferencia);

// Consultar estado de pago de un pedido
router.get('/orders/:orderId/status', autenticar, ctrl.getEstadoPago);

// Webhook de Mercado Pago — SIN autenticación JWT
// MP llama a esta URL desde sus servidores
router.post('/webhook', ctrl.webhook);

module.exports = router;