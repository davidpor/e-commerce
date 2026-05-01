// src/modules/pricing/pricing.router.js
const { Router } = require('express');
const ctrl = require('./pricing.controller');
const { autenticar, autorizar } = require('../../middlewares/auth.middleware');

const router = Router();

// Catálogo con precios personalizados para el cliente logueado
// GET /api/pricing/catalog → devuelve productos con MI precio
router.get('/catalog', autenticar, ctrl.getCatalogoConPrecios);

// Calcular precio de un producto para una empresa (admin/vendedor)
router.post('/calculate', autenticar, autorizar('admin', 'vendedor'), ctrl.calcularPrecio);

// CRUD de listas (solo admin)
router.get('/',    autenticar, autorizar('admin', 'vendedor'), ctrl.getListas);
router.get('/:id', autenticar, autorizar('admin', 'vendedor'), ctrl.getListaPorId);
router.post('/',   autenticar, autorizar('admin'), ctrl.crearLista);
router.put('/:id', autenticar, autorizar('admin'), ctrl.actualizarLista);

// Gestión de ítems dentro de una lista
router.post('/:id/items',            autenticar, autorizar('admin'), ctrl.agregarItem);
router.delete('/:id/items/:itemId',  autenticar, autorizar('admin'), ctrl.eliminarItem);

// Asignar lista a una empresa
router.patch('/companies/:companyId/assign', autenticar, autorizar('admin'), ctrl.asignarListaAEmpresa);

module.exports = router;