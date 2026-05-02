// src/modules/orders/orders.controller.js
const service = require('./orders.service');

const getPedidos = async (req, res, next) => {
  try {
    const resultado = await service.getPedidos(req.user, req.query);
    res.json(resultado);
  } catch (e) { next(e); }
};

const getPedidoPorId = async (req, res, next) => {
  try {
    const pedido = await service.getPedidoPorId(req.params.id, req.user);
    res.json({ pedido });
  } catch (e) { next(e); }
};

// Crear pedido desde cotización aprobada
const crearDesdeCotizacion = async (req, res, next) => {
  try {
    const pedido = await service.crearDesdeCotizacion(
      req.params.quoteId,
      req.user.id,
      req.body
    );
    res.status(201).json({ pedido });
  } catch (e) { next(e); }
};

// Cambios de estado
const iniciarPreparacion = async (req, res, next) => {
  try {
    const pedido = await service.cambiarEstado(
      req.params.id, 'en_preparacion', req.user.id, req.body
    );
    res.json({ pedido });
  } catch (e) { next(e); }
};

const marcarDespachado = async (req, res, next) => {
  try {
    const pedido = await service.cambiarEstado(
      req.params.id, 'despachado', req.user.id, req.body
    );
    res.json({ pedido });
  } catch (e) { next(e); }
};

const marcarEntregado = async (req, res, next) => {
  try {
    const pedido = await service.cambiarEstado(
      req.params.id, 'entregado', req.user.id, req.body
    );
    res.json({ pedido });
  } catch (e) { next(e); }
};

const cancelarPedido = async (req, res, next) => {
  try {
    const pedido = await service.cambiarEstado(
      req.params.id, 'cancelado', req.user.id, req.body
    );
    res.json({ pedido });
  } catch (e) { next(e); }
};

const actualizarPedido = async (req, res, next) => {
  try {
    const pedido = await service.actualizarPedido(req.params.id, req.body);
    res.json({ pedido });
  } catch (e) { next(e); }
};

module.exports = {
  getPedidos, getPedidoPorId,
  crearDesdeCotizacion,
  iniciarPreparacion, marcarDespachado,
  marcarEntregado, cancelarPedido,
  actualizarPedido,
};