// src/modules/notifications/email.service.js
const nodemailer = require('nodemailer');
const templates  = require('./templates');

// Creamos el transporter de Nodemailer con los datos del SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // true para puerto 465, false para otros
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ── Función base de envío ──────────────────────────────────────────────────
const enviar = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    });
    console.log(`\x1b[32m[Email]\x1b[0m Enviado a ${to}: ${subject} (${info.messageId})`);
    return { enviado: true, messageId: info.messageId };
  } catch (error) {
    // No lanzamos el error — un fallo de email no debe romper el flujo principal
    console.error(`\x1b[31m[Email]\x1b[0m Error enviando a ${to}:`, error.message);
    return { enviado: false, error: error.message };
  }
};

// ── Funciones específicas por evento ──────────────────────────────────────

const enviarBienvenida = async ({ email, nombre, razonSocial }) => {
  const { subject, html } = templates.bienvenida({ nombre, razonSocial });
  return enviar({ to: email, subject, html });
};

const enviarCuentaActivada = async ({ email, nombre, razonSocial }) => {
  const { subject, html } = templates.cuentaActivada({
    nombre,
    razonSocial,
    frontendUrl: process.env.FRONTEND_URL,
  });
  return enviar({ to: email, subject, html });
};

const enviarCotizacionRecibida = async ({ email, nombre, cotizacion }) => {
  const { subject, html } = templates.cotizacionRecibida({ nombre, cotizacion });
  return enviar({ to: email, subject, html });
};

const enviarCotizacionAprobada = async ({ email, nombre, cotizacion }) => {
  const { subject, html } = templates.cotizacionAprobada({
    nombre,
    cotizacion,
    frontendUrl: process.env.FRONTEND_URL,
  });
  return enviar({ to: email, subject, html });
};

const enviarCotizacionRechazada = async ({ email, nombre, cotizacion }) => {
  const { subject, html } = templates.cotizacionRechazada({ nombre, cotizacion });
  return enviar({ to: email, subject, html });
};

const enviarPedidoConfirmado = async ({ email, nombre, pedido }) => {
  const { subject, html } = templates.pedidoConfirmado({
    nombre,
    pedido,
    frontendUrl: process.env.FRONTEND_URL,
  });
  return enviar({ to: email, subject, html });
};

const enviarPedidoDespachado = async ({ email, nombre, pedido }) => {
  const { subject, html } = templates.pedidoDespachado({ nombre, pedido });
  return enviar({ to: email, subject, html });
};

module.exports = {
  enviarBienvenida,
  enviarCuentaActivada,
  enviarCotizacionRecibida,
  enviarCotizacionAprobada,
  enviarCotizacionRechazada,
  enviarPedidoConfirmado,
  enviarPedidoDespachado,
};