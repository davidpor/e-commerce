// src/modules/quotes/quotes.controller.js
const service = require('./quotes.service');

const getCotizaciones = async (req, res, next) => {
  try {
    const resultado = await service.getCotizaciones(req.user, req.query);
    res.json(resultado);
  } catch (e) { next(e); }
};

const getCotizacionPorId = async (req, res, next) => {
  try {
    const cotizacion = await service.getCotizacionPorId(req.params.id);
    res.json({ cotizacion });
  } catch (e) { next(e); }
};

const crearCotizacion = async (req, res, next) => {
  try {
    const cotizacion = await service.crearCotizacion(
      req.user.id,
      req.user.company_id,
      req.body
    );
    res.status(201).json({ cotizacion });
  } catch (e) { next(e); }
};

const agregarItems = async (req, res, next) => {
  try {
    const cotizacion = await service.agregarItems(
      req.params.id,
      req.user.company_id,
      req.body.items
    );
    res.json({ cotizacion });
  } catch (e) { next(e); }
};

const eliminarItem = async (req, res, next) => {
  try {
    const cotizacion = await service.eliminarItem(req.params.id, req.params.itemId);
    res.json({ cotizacion });
  } catch (e) { next(e); }
};

const enviarCotizacion = async (req, res, next) => {
  try {
    const cotizacion = await service.enviarCotizacion(req.params.id, req.user.id);
    res.json({ cotizacion });
  } catch (e) { next(e); }
};

const aprobarCotizacion = async (req, res, next) => {
  try {
    const cotizacion = await service.aprobarCotizacion(
      req.params.id,
      req.user.id,
      req.body
    );
    res.json({ cotizacion });
  } catch (e) { next(e); }
};

const rechazarCotizacion = async (req, res, next) => {
  try {
    const cotizacion = await service.rechazarCotizacion(
      req.params.id,
      req.user.id,
      req.body.motivo
    );
    res.json({ cotizacion });
  } catch (e) { next(e); }
};

module.exports = {
  getCotizaciones, getCotizacionPorId,
  crearCotizacion, agregarItems, eliminarItem,
  enviarCotizacion, aprobarCotizacion, rechazarCotizacion,
};