// src/modules/orders/orders.router.js
const { Router } = require('express');
const ctrl = require('./orders.controller');
const { autenticar, autorizar } = require('../../middlewares/auth.middleware');

const router = Router();

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