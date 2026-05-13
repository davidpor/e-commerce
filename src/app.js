// src/app.js
require('dotenv').config();

const path = require('path');
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const swaggerUi  = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const { limiterGeneral } = require('./middlewares/rateLimit.middleware');

const sequelize = require('./config/database');
require('./config/redis');

// Cargamos todos los modelos antes del sync
require('./modules/users/company.model');
require('./modules/users/user.model');
require('./modules/catalog/category.model');
require('./modules/catalog/product.model');
require('./modules/pricing/pricing.model');
require('./modules/quotes/quote.model');
require('./modules/orders/order.model');

const app = express();

// ── Seguridad ──────────────────────────────────────────────────────────────
app.use(helmet({
  // Permitimos que swagger-ui cargue sus recursos
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: (origin, callback) => {
    // Lista de orígenes permitidos
    const permitidos = [
      'http://localhost:3001',   // frontend en desarrollo local
      'http://localhost:3000',   // para pruebas desde el mismo puerto
      process.env.FRONTEND_URL, // URL configurada en .env
    ].filter(Boolean);

    // Permitimos requests sin origin (curl, Postman, Swagger)
    if (!origin || permitidos.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS bloqueado para: ${origin}`));
    }
  },
  credentials: true
}));

// Rate limiting general — aplica a todas las rutas
app.use('/api', limiterGeneral);

// ── Logging y parseo ───────────────────────────────────────────────────────
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Servimos las imágenes subidas como archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── Documentación Swagger ──────────────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Ferretería B2B — API Docs',
  customCss: '.swagger-ui .topbar { display: none }',
}));

// Endpoint que devuelve el spec en JSON (útil para herramientas externas)
app.get('/api/docs.json', (req, res) => res.json(swaggerSpec));

// ── Rutas base ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status:      'ok',
    timestamp:   new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version:     '1.0.0',
  });
});

app.get('/', (req, res) => {
  res.json({
    nombre:        'Ferretería B2B API',
    version:       '1.0.0',
    documentacion: '/api/docs',
  });
});

// ── Módulos de la API ──────────────────────────────────────────────────────
app.use('/api/auth',     require('./modules/auth/auth.router'));
app.use('/api/products', require('./modules/catalog/catalog.router'));
app.use('/api/pricing',  require('./modules/pricing/pricing.router'));
app.use('/api/quotes',   require('./modules/quotes/quotes.router'));
app.use('/api/orders',   require('./modules/orders/orders.router'));
app.use('/api/payments', require('./modules/payments/payments.router'));

// ── 404 ────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    ruta:  req.originalUrl,
    docs:  '/api/docs',
  });
});

// ── Manejador de errores global ────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('\x1b[31m[Error]\x1b[0m', err.message);
  res.status(err.statusCode || 500).json({
    error: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ── Inicio del servidor ────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('\x1b[32m[DB]\x1b[0m Conexión a MariaDB exitosa');

    await sequelize.sync({ force: false });
    console.log('\x1b[32m[DB]\x1b[0m Modelos sincronizados');

    app.listen(PORT, () => {
      console.log(`\x1b[32m[Server]\x1b[0m Corriendo en http://localhost:${PORT}`);
      console.log(`\x1b[32m[Server]\x1b[0m Entorno: ${process.env.NODE_ENV}`);
      console.log(`\x1b[32m[Docs]\x1b[0m   http://localhost:${PORT}/api/docs`);
    });

  } catch (error) {
    console.error('\x1b[31m[Error]\x1b[0m No se pudo iniciar:', error.message);
    process.exit(1);
  }
};

startServer();