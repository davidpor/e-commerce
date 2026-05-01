// src/utils/errors.js

// Creamos una clase de error personalizada que incluye
// el código HTTP además del mensaje.
// Esto nos permite lanzar errores desde cualquier parte
// del código y el manejador global los captura correctamente.

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);           // llama al constructor de Error
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    // Capturamos el stack trace para debugging
    Error.captureStackTrace(this, this.constructor);
  }
}

// Errores comunes ya preparados para usar en cualquier módulo
const errors = {
  notFound: (resource = 'Recurso') => 
    new AppError(`${resource} no encontrado`, 404),
  
  unauthorized: (msg = 'No autorizado') => 
    new AppError(msg, 401),
  
  forbidden: (msg = 'Sin permisos suficientes') => 
    new AppError(msg, 403),
  
  badRequest: (msg = 'Datos inválidos') => 
    new AppError(msg, 400),
  
  conflict: (msg = 'Ya existe un registro con esos datos') => 
    new AppError(msg, 409),
};

module.exports = { AppError, errors };