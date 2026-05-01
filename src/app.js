// src/app.js

// Cargamos las variables de entorno PRIMERO que todo
// Si esto no está al principio, el resto del código no
// encuentra las variables cuando las necesita
require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');

// Importamos nuestras configuraciones
const sequelize = require('./config/database');
require('./config/redis'); // solo para iniciar la conexión

// Creamos la aplicación Express
const app = express();

// ======================
// MIDDLEWARES GLOBALES
// (se ejecutan en cada request antes de llegar a las rutas)
// ======================

// Helmet agrega headers HTTP de seguridad automáticamente
// Por ejemplo: X-Content-Type-Options, X-Frame-Options, etc.
app.use(helmet());

// CORS: permite que el frontend (en otro puerto/dominio) hable con la API
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true, // permite enviar cookies en los requests
}));

// Morgan: logger de requests. 'dev' es el formato que muestra
// método, ruta, status y tiempo de respuesta con colores
app.use(morgan('dev'));

// express.json(): permite que Express lea el body de los requests
// en formato JSON (lo que enviará el frontend en los POST/PUT)
app.use(express.json());

// express.urlencoded(): permite leer datos de formularios HTML
app.use(express.urlencoded({ extended: true }));

// ======================
// RUTAS
// ======================

// Ruta de salud: sirve para verificar que el servidor está vivo.
// Es útil para monitoreo y para Docker health checks.
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Ruta raíz con info básica de la API
app.get('/', (req, res) => {
  res.json({
    nombre: 'Ferretería B2B API',
    version: '1.0.0',
    documentacion: '/api/docs', // lo agregaremos más adelante con Swagger
  });
});

// Placeholder para las rutas del sistema (las vamos agregando de a módulos)
// app.use('/api/auth',     require('./modules/auth/auth.router'));
// app.use('/api/products', require('./modules/catalog/catalog.router'));
// app.use('/api/orders',   require('./modules/orders/orders.router'));

// ======================
// MANEJO DE ERRORES GLOBAL
// ======================

// Ruta no encontrada (404) - debe ir DESPUÉS de todas las rutas
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    ruta: req.originalUrl,
  });
});

// Manejador de errores global - Express lo reconoce por los 4 parámetros
// Cualquier error que se pase con next(error) llega acá
app.use((err, req, res, next) => {
  console.error('\x1b[31m[Error]\x1b[0m', err.message);
  
  // En desarrollo enviamos el stack trace para debuggear más fácil
  // En producción solo el mensaje (no queremos exponer detalles internos)
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ======================
// INICIO DEL SERVIDOR
// ======================

const PORT = process.env.PORT || 3000;

// Función async para poder usar await al conectar la BD
const startServer = async () => {
  try {
    // Verificamos que podemos conectar a MariaDB
    await sequelize.authenticate();
    console.log('\x1b[32m[DB]\x1b[0m Conexión a MariaDB exitosa');

    // Sincronizamos modelos con la BD
    // { alter: true } actualiza tablas existentes sin borrar datos
    // OJO: en producción se usan migraciones, no sync
    await sequelize.sync({ alter: true });
    console.log('\x1b[32m[DB]\x1b[0m Modelos sincronizados');

    // Arrancamos el servidor HTTP
    app.listen(PORT, () => {
      console.log(`\x1b[32m[Server]\x1b[0m Corriendo en http://localhost:${PORT}`);
      console.log(`\x1b[32m[Server]\x1b[0m Entorno: ${process.env.NODE_ENV}`);
    });

  } catch (error) {
    console.error('\x1b[31m[Error]\x1b[0m No se pudo iniciar el servidor:', error);
    process.exit(1); // Salimos con código de error para que el sistema sepa que falló
  }
};

startServer();