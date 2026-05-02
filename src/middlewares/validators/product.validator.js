// src/middlewares/validators/product.validator.js
const { body, query } = require('express-validator');

const validarProducto = [
  body('sku')
    .notEmpty().withMessage('El SKU es requerido')
    .isLength({ min: 2, max: 50 }).withMessage('SKU entre 2 y 50 caracteres')
    .trim(),

  body('nombre')
    .notEmpty().withMessage('El nombre es requerido')
    .isLength({ min: 3, max: 200 }).withMessage('Nombre entre 3 y 200 caracteres')
    .trim(),

  body('precio_lista')
    .isFloat({ min: 0 }).withMessage('El precio debe ser un número positivo'),

  body('stock_actual')
    .optional()
    .isInt({ min: 0 }).withMessage('El stock debe ser un entero positivo'),

  body('cantidad_minima')
    .optional()
    .isInt({ min: 1 }).withMessage('La cantidad mínima debe ser al menos 1'),

  body('category_id')
    .optional()
    .isInt({ min: 1 }).withMessage('ID de categoría inválido'),
];

const validarFiltros = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('La página debe ser un número positivo'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('El límite debe estar entre 1 y 100'),

  query('precio_min')
    .optional()
    .isFloat({ min: 0 }).withMessage('Precio mínimo inválido'),

  query('precio_max')
    .optional()
    .isFloat({ min: 0 }).withMessage('Precio máximo inválido'),
];

module.exports = { validarProducto, validarFiltros };