// src/modules/auth/auth.controller.js
const authService = require('./auth.service');

// El controlador solo recibe el request, llama al servicio
// y devuelve la respuesta. Sin lógica de negocio acá.

const register = async (req, res, next) => {
  try {
    const resultado = await authService.registrar(req.body);
    res.status(201).json(resultado);
  } catch (error) {
    // Pasamos el error al manejador global de app.js
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const resultado = await authService.login({ email, password });
    res.status(200).json(resultado);
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    // req.user lo agrega el middleware de autenticación
    const resultado = await authService.logout(req.user.id);
    res.status(200).json(resultado);
  } catch (error) {
    next(error);
  }
};

// Devuelve los datos del usuario logueado (útil para el frontend)
const me = async (req, res, next) => {
  try {
    res.status(200).json({ usuario: req.user });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, logout, me };