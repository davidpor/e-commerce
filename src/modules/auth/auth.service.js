// src/modules/auth/auth.service.js
const jwt = require('jsonwebtoken');
const User = require('../users/user.model');
const Company = require('../users/company.model');
const redis = require('../../config/redis');
const { errors } = require('../../utils/errors');

// ─── Función privada: genera los dos tokens ───────────────────────────────────
const generarTokens = (payload) => {
  // Access token: vida corta (8 horas), se envía en cada request
  const accessToken = jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  // Refresh token: vida larga (7 días), solo para renovar el access token
  const refreshToken = jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
  );

  return { accessToken, refreshToken };
};

// ─── Registro de nueva empresa + usuario administrador ───────────────────────
const registrar = async ({ empresa, usuario }) => {

  // Verificamos que el CUIT no esté ya registrado
  const empresaExistente = await Company.findOne({ 
    where: { cuit: empresa.cuit } 
  });
  if (empresaExistente) {
    throw errors.conflict('Ya existe una empresa registrada con ese CUIT');
  }

  // Verificamos que el email no esté en uso
  const emailExistente = await User.findOne({ 
    where: { email: usuario.email } 
  });
  if (emailExistente) {
    throw errors.conflict('Ya existe una cuenta con ese email');
  }

  // Creamos la empresa primero
  const nuevaEmpresa = await Company.create({
    razon_social:    empresa.razon_social,
    cuit:            empresa.cuit,
    condicion_iva:   empresa.condicion_iva || 'responsable_inscripto',
    telefono:        empresa.telefono,
    email_contacto:  empresa.email_contacto,
    direccion:       empresa.direccion,
    ciudad:          empresa.ciudad,
    provincia:       empresa.provincia,
    activa: false, // el admin del sistema debe aprobarla
  });

  // Creamos el usuario vinculado a esa empresa
  // El password_hash se encripta automáticamente en el hook beforeCreate
  const nuevoUsuario = await User.create({
    nombre:        usuario.nombre,
    apellido:      usuario.apellido,
    email:         usuario.email,
    password_hash: usuario.password,  // el hook lo encripta antes de guardar
    telefono:      usuario.telefono,
    rol:           'cliente',
    company_id:    nuevaEmpresa.id,
  });

  return {
    mensaje: 'Registro exitoso. Tu cuenta será activada en las próximas 24 horas.',
    empresa: nuevaEmpresa,
    usuario: nuevoUsuario.toPublic(),
  };
};

// ─── Login ────────────────────────────────────────────────────────────────────
const login = async ({ email, password }) => {

  // Buscamos el usuario e incluimos los datos de su empresa
  const usuario = await User.findOne({
    where: { email },
    include: [{ model: Company, as: 'empresa' }],
  });

  // Usamos el mismo mensaje para usuario no encontrado y contraseña incorrecta.
  // Esto evita que alguien pueda descubrir qué emails están registrados.
  if (!usuario) {
    throw errors.unauthorized('Email o contraseña incorrectos');
  }

  // Verificamos la contraseña usando el método del modelo
  const passwordValida = await usuario.validarPassword(password);
  if (!passwordValida) {
    throw errors.unauthorized('Email o contraseña incorrectos');
  }

  // Verificamos que el usuario esté activo
  if (!usuario.activo) {
    throw errors.unauthorized('Tu cuenta está desactivada. Contactá al administrador.');
  }

  // Para clientes, verificamos que su empresa esté activa/aprobada
  if (usuario.rol === 'cliente' && usuario.empresa && !usuario.empresa.activa) {
    throw errors.unauthorized('Tu empresa está pendiente de aprobación.');
  }

  // Actualizamos el último login
  await usuario.update({ ultimo_login: new Date() });

  // Generamos los tokens con la info del usuario como payload
  const payload = {
    id:         usuario.id,
    rol:        usuario.rol,
    company_id: usuario.company_id,
  };
  const { accessToken, refreshToken } = generarTokens(payload);

  // Guardamos el refresh token en Redis con TTL de 7 días (604800 segundos)
  // Esto nos permite invalidarlo en el logout sin necesidad de una lista negra
  await redis.setex(
    `refresh_token:${usuario.id}`,
    604800,
    refreshToken
  );

  return {
    accessToken,
    refreshToken,
    usuario: usuario.toPublic(),
  };
};

// ─── Logout ───────────────────────────────────────────────────────────────────
const logout = async (userId) => {
  // Eliminamos el refresh token de Redis
  // Así aunque alguien tenga el token, ya no es válido
  await redis.del(`refresh_token:${userId}`);
  return { mensaje: 'Sesión cerrada correctamente' };
};

module.exports = { registrar, login, logout };