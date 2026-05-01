// src/middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');
const { errors } = require('../utils/errors');
const User = require('../modules/users/user.model');
const Company = require('../modules/users/company.model');

// Middleware que verifica el JWT en cada request protegido
const autenticar = async (req, res, next) => {
  try {
    // El token llega en el header: Authorization: Bearer <token>
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw errors.unauthorized('Token no proporcionado');
    }

    const token = authHeader.split(' ')[1];

    // Verificamos y decodificamos el token
    // Si está vencido o es inválido, jwt.verify lanza un error
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscamos el usuario en la BD para tener sus datos actualizados
    const usuario = await User.findByPk(decoded.id, {
      include: [{ model: Company, as: 'empresa' }],
    });

    if (!usuario || !usuario.activo) {
      throw errors.unauthorized('Usuario no encontrado o desactivado');
    }

    // Agregamos el usuario al request para que las rutas lo usen
    req.user = usuario.toPublic();
    next();

  } catch (error) {
    // Los errores de JWT tienen nombres específicos
    if (error.name === 'TokenExpiredError') {
      return next(errors.unauthorized('Token expirado'));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(errors.unauthorized('Token inválido'));
    }
    next(error);
  }
};

// Middleware que verifica roles DESPUÉS de autenticar
// Uso: router.get('/ruta', autenticar, autorizar('admin', 'vendedor'), handler)
const autorizar = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.rol)) {
    return next(errors.forbidden(
      `Esta acción requiere rol: ${roles.join(' o ')}`
    ));
  }
  next();
};

module.exports = { autenticar, autorizar };