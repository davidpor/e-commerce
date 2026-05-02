// src/middlewares/validators/auth.validator.js
const { body } = require('express-validator');

const validarLogin = [
  body('email')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
    .notEmpty().withMessage('La contraseña es requerida'),
];

const validarRegistro = [
  // Validaciones de la empresa
  body('empresa.razon_social')
    .notEmpty().withMessage('La razón social es requerida')
    .isLength({ min: 3, max: 200 }).withMessage('La razón social debe tener entre 3 y 200 caracteres')
    .trim(),

  body('empresa.cuit')
    .notEmpty().withMessage('El CUIT es requerido')
    .matches(/^\d{2}-\d{8}-\d{1}$/).withMessage('CUIT inválido. Formato esperado: XX-XXXXXXXX-X'),

  body('empresa.condicion_iva')
    .isIn(['responsable_inscripto', 'monotributista', 'exento', 'consumidor_final'])
    .withMessage('Condición IVA inválida'),

  // Validaciones del usuario
  body('usuario.nombre')
    .notEmpty().withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 100 }).withMessage('Nombre entre 2 y 100 caracteres')
    .trim(),

  body('usuario.apellido')
    .notEmpty().withMessage('El apellido es requerido')
    .isLength({ min: 2, max: 100 }).withMessage('Apellido entre 2 y 100 caracteres')
    .trim(),

  body('usuario.email')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),

  body('usuario.password')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/[A-Z]/).withMessage('La contraseña debe tener al menos una mayúscula')
    .matches(/[0-9]/).withMessage('La contraseña debe tener al menos un número'),
];

module.exports = { validarLogin, validarRegistro };