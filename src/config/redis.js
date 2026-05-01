// src/config/redis.js
const Redis = require('ioredis');
require('dotenv').config();

// Creamos el cliente Redis
const redis = new Redis(process.env.REDIS_URL, {
  // Si Redis no está disponible, reintentamos hasta 3 veces
  // antes de tirar error (útil al arrancar el servidor)
  maxRetriesPerRequest: 3,
  
  // Evento cuando se conecta exitosamente
  lazyConnect: false,
});

redis.on('connect', () => {
  console.log('\x1b[32m[Redis]\x1b[0m Conectado correctamente');
});

redis.on('error', (err) => {
  console.error('\x1b[31m[Redis]\x1b[0m Error de conexión:', err.message);
});

module.exports = redis;