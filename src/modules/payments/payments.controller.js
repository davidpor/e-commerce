// src/modules/payments/payments.controller.js
const service = require('./payments.service');

// Crea la preferencia de pago y devuelve la URL de Mercado Pago
const crearPreferencia = async (req, res, next) => {
  try {
    const resultado = await service.crearPreferencia(
      req.params.orderId,
      req.user.id
    );
    res.json(resultado);
  } catch (e) { next(e); }
};

// Webhook: Mercado Pago llama a este endpoint cuando hay cambios en el pago.
// IMPORTANTE: este endpoint NO lleva autenticación JWT porque lo llama
// un servidor externo (Mercado Pago), no un usuario logueado.
const webhook = async (req, res, next) => {
  try {
    // Respondemos 200 inmediatamente a MP para que no reintente.
    // El procesamiento lo hacemos después de responder.
    res.status(200).json({ recibido: true });

    // Procesamos el webhook de forma asíncrona
    await service.procesarWebhook(req.body, req.headers);
  } catch (error) {
    // No llamamos a next(error) porque ya respondimos.
    // Solo logueamos el error internamente.
    console.error('[MP Webhook] Error al procesar:', error.message);
  }
};

const getEstadoPago = async (req, res, next) => {
  try {
    const estado = await service.getEstadoPago(req.params.orderId);
    res.json({ pago: estado });
  } catch (e) { next(e); }
};

module.exports = { crearPreferencia, webhook, getEstadoPago };