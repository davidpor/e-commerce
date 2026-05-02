// src/middlewares/validate.middleware.js
const { validationResult } = require('express-validator');

// Este middleware se pone DESPUÉS de los validadores en la ruta.
// Si hay errores de validación, responde 400 con los detalles.
// Si no hay errores, pasa al controlador.
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Datos inválidos',
      // Formateamos los errores para que sean legibles
      detalles: errors.array().map(err => ({
        campo:   err.path,
        mensaje: err.msg,
        valor:   err.value,
      })),
    });
  }
  next();
};

module.exports = validate;