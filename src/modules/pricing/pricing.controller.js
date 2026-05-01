// src/modules/pricing/pricing.controller.js
const service = require('./pricing.service');

const getListas = async (req, res, next) => {
  try {
    const listas = await service.getListas();
    res.json({ listas });
  } catch (e) { next(e); }
};

const getListaPorId = async (req, res, next) => {
  try {
    const lista = await service.getListaPorId(req.params.id);
    res.json({ lista });
  } catch (e) { next(e); }
};

const crearLista = async (req, res, next) => {
  try {
    const lista = await service.crearLista(req.body);
    res.status(201).json({ lista });
  } catch (e) { next(e); }
};

const actualizarLista = async (req, res, next) => {
  try {
    const lista = await service.actualizarLista(req.params.id, req.body);
    res.json({ lista });
  } catch (e) { next(e); }
};

const agregarItem = async (req, res, next) => {
  try {
    const resultado = await service.agregarOActualizarItem(
      req.params.id, 
      req.body
    );
    res.status(resultado.creado ? 201 : 200).json(resultado);
  } catch (e) { next(e); }
};

const eliminarItem = async (req, res, next) => {
  try {
    const resultado = await service.eliminarItem(
      req.params.id, 
      req.params.itemId
    );
    res.json(resultado);
  } catch (e) { next(e); }
};

const asignarListaAEmpresa = async (req, res, next) => {
  try {
    const resultado = await service.asignarListaAEmpresa(
      req.params.companyId,
      req.body.price_list_id
    );
    res.json(resultado);
  } catch (e) { next(e); }
};

const calcularPrecio = async (req, res, next) => {
  try {
    const { product_id, company_id, cantidad } = req.body;
    const resultado = await service.calcularPrecio(
      product_id,
      company_id,
      parseInt(cantidad) || 1
    );
    res.json(resultado);
  } catch (e) { next(e); }
};

const getCatalogoConPrecios = async (req, res, next) => {
  try {
    // El company_id viene del token JWT del usuario logueado
    const companyId = req.user.company_id;
    const catalogo  = await service.getCatalogoConPrecios(companyId, req.query);
    res.json({ catalogo });
  } catch (e) { next(e); }
};

module.exports = {
  getListas, getListaPorId, crearLista, actualizarLista,
  agregarItem, eliminarItem, asignarListaAEmpresa,
  calcularPrecio, getCatalogoConPrecios,
};