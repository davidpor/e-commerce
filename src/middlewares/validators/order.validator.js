// src/middlewares/validators/order.validator.js
const { body } = require('express-validator');

const validarPedido = [
  body('metodo_pago')
    .isIn(['transferencia', 'cheque', 'cuenta_corriente', 'mercado_pago', 'efectivo'])
    .withMessage('Método de pago inválido'),

  body('direccion_entrega')
    .optional()
    .isLength({ max: 400 }).withMessage('Dirección demasiado larga'),
];

const validarCambioEstado = [
  body('nota')
    .optional()
    .isLength({ max: 500 }).withMessage('La nota no puede superar 500 caracteres')
    .trim(),

  body('motivo')
    .optional()
    .isLength({ max: 500 }).withMessage('El motivo no puede superar 500 caracteres')
    .trim(),
];

module.exports = { validarPedido, validarCambioEstado };