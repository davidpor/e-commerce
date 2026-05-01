// src/modules/quotes/quotes.router.js
const { Router } = require('express');
const ctrl = require('./quotes.controller');
const { autenticar, autorizar } = require('../../middlewares/auth.middleware');

const router = Router();

// Todos los roles autenticados pueden ver cotizaciones
// (el servicio filtra por empresa si es cliente)
router.get('/',    autenticar, ctrl.getCotizaciones);
router.get('/:id', autenticar, ctrl.getCotizacionPorId);

// Clientes crean y gestionan sus cotizaciones en borrador
router.post('/',                       autenticar, ctrl.crearCotizacion);
router.post('/:id/items',              autenticar, ctrl.agregarItems);
router.delete('/:id/items/:itemId',    autenticar, ctrl.eliminarItem);

// El cliente envía la cotización para revisión
router.patch('/:id/submit',   autenticar, ctrl.enviarCotizacion);

// Solo vendedores y admins pueden aprobar o rechazar
router.patch('/:id/approve',
  autenticar, autorizar('admin', 'vendedor'), ctrl.aprobarCotizacion);

router.patch('/:id/reject',
  autenticar, autorizar('admin', 'vendedor'), ctrl.rechazarCotizacion);

module.exports = router;