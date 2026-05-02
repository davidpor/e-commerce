// src/modules/pricing/pricing.router.js
const { Router } = require('express');
const ctrl = require('./pricing.controller');
const { autenticar, autorizar } = require('../../middlewares/auth.middleware');

const router = Router();

/**
 * @swagger
 * /api/pricing:
 *   get:
 *     summary: Listar listas de precios
 *     tags: [Precios]
 *     responses:
 *       200: { description: Lista de listas de precios }
 *   post:
 *     summary: Crear lista de precios
 *     tags: [Precios]
 *     responses:
 *       201: { description: Lista creada }
 *
 * /api/pricing/catalog:
 *   get:
 *     summary: Catálogo con precios personalizados para el cliente logueado
 *     tags: [Precios]
 *     responses:
 *       200: { description: Catálogo con precios del cliente }
 *
 * /api/pricing/calculate:
 *   post:
 *     summary: Calcular precio para un producto y empresa
 *     tags: [Precios]
 *     responses:
 *       200: { description: Precio calculado }
 */

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