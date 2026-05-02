// src/modules/auth/auth.router.js
const { Router } = require('express');
const controller = require('./auth.controller');
const { autenticar } = require('../../middlewares/auth.middleware');
const { limiterAuth } = require('../../middlewares/rateLimit.middleware');
const validate = require('../../middlewares/validate.middleware');
const { validarLogin, validarRegistro } = require('../../middlewares/validators/auth.validator');

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar nueva empresa mayorista
 *     tags: [Autenticación]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [empresa, usuario]
 *             properties:
 *               empresa:
 *                 type: object
 *                 properties:
 *                   razon_social: { type: string, example: "Ferretería López SA" }
 *                   cuit: { type: string, example: "20-12345678-9" }
 *                   condicion_iva: { type: string, example: "responsable_inscripto" }
 *               usuario:
 *                 type: object
 *                 properties:
 *                   nombre: { type: string, example: "Carlos" }
 *                   apellido: { type: string, example: "López" }
 *                   email: { type: string, example: "carlos@lopezsa.com" }
 *                   password: { type: string, example: "MiPassword123" }
 *     responses:
 *       201: { description: Empresa registrada exitosamente }
 *       409: { description: CUIT o email ya registrado }
 */

// POST /api/auth/register — registrar nueva empresa + usuario
router.post('/register', limiterAuth, validarRegistro, validate, controller.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Autenticación]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: "carlos@lopezsa.com" }
 *               password: { type: string, example: "MiPassword123" }
 *     responses:
 *       200: { description: Login exitoso, devuelve accessToken y refreshToken }
 *       401: { description: Credenciales inválidas }
 */

// POST /api/auth/login — iniciar sesión
router.post('/login', limiterAuth, validarLogin, validate, controller.login);

// POST /api/auth/logout — cerrar sesión (requiere estar logueado)
router.post('/logout', autenticar, controller.logout);

// GET /api/auth/me — obtener mi perfil (requiere estar logueado)
router.get('/me', autenticar, controller.me);

module.exports = router;