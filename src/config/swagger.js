// src/config/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title:       'Ferretería B2B API',
      version:     '1.0.0',
      description: 'API REST para sistema de e-commerce B2B mayorista de ferretería',
      contact: {
        name:  'Soporte técnico',
        email: 'dev@ferreterialopez.com.ar',
      },
    },
    servers: [
      {
        url:         `http://localhost:${process.env.PORT || 3000}`,
        description: 'Servidor de desarrollo',
      },
    ],
    // Definimos el esquema de autenticación JWT
    components: {
      securitySchemes: {
        bearerAuth: {
          type:         'http',
          scheme:       'bearer',
          bearerFormat: 'JWT',
          description:  'Ingresá el token JWT obtenido en /api/auth/login',
        },
      },
    },
    // Aplicamos JWT a todos los endpoints por defecto
    security: [{ bearerAuth: [] }],
  },
  // Le decimos a swagger-jsdoc dónde buscar los comentarios JSDoc
  apis: ['./src/modules/**/*.router.js'],
};

module.exports = swaggerJsdoc(options);