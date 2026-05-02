// src/middlewares/rateLimit.middleware.js
const rateLimit = require('express-rate-limit');

// ── Rate limiter general ───────────────────────────────────────────────────
// Aplica a todas las rutas de la API.
// Permite 100 requests por IP cada 15 minutos.
const limiterGeneral = rateLimit({
  windowMs: 15 * 60 * 1000, // ventana de 15 minutos
  max: 100,                  // máximo de requests por ventana
  standardHeaders: 'draft-7',     // incluye headers RateLimit-* en la respuesta
  legacyHeaders: false,      // desactiva headers X-RateLimit-* (deprecados)
  message: {
    error: 'Demasiadas solicitudes desde esta IP. Intentá nuevamente en 15 minutos.'
  },
});

// ── Rate limiter estricto para auth ───────────────────────────────────────
// El login es el endpoint más atacado. Lo limitamos más agresivamente:
// solo 10 intentos por IP cada 15 minutos.
// Si alguien intenta adivinar contraseñas (fuerza bruta), queda bloqueado.
const limiterAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    error: 'Demasiados intentos de login. Esperá 15 minutos antes de reintentar.'
  },
  // skipSuccessfulRequests: true → los logins exitosos no cuentan para el límite
  skipSuccessfulRequests: true,
});

// ── Rate limiter para creación de recursos ────────────────────────────────
// Limita la creación de cotizaciones y pedidos para evitar spam.
const limiterCreacion = rateLimit({
  windowMs: 60 * 60 * 1000, // ventana de 1 hora
  max: 30,                   // máximo 30 creaciones por hora
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Límite de creación alcanzado. Intentá nuevamente en una hora.'
  },
});

module.exports = { limiterGeneral, limiterAuth, limiterCreacion };