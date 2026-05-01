// src/modules/auth/auth.router.js
const { Router } = require('express');
const controller = require('./auth.controller');
const { autenticar } = require('../../middlewares/auth.middleware');

const router = Router();

// POST /api/auth/register — registrar nueva empresa + usuario
router.post('/register', controller.register);

// POST /api/auth/login — iniciar sesión
router.post('/login', controller.login);

// POST /api/auth/logout — cerrar sesión (requiere estar logueado)
router.post('/logout', autenticar, controller.logout);

// GET /api/auth/me — obtener mi perfil (requiere estar logueado)
router.get('/me', autenticar, controller.me);

module.exports = router;