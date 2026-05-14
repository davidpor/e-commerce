// src/modules/quotes/quotes.service.js
const { Quote, QuoteItem } = require('./quote.model');
const Product  = require('../catalog/product.model');
const Company  = require('../users/company.model');
const { calcularPrecio } = require('../pricing/pricing.service');
const { errors } = require('../../utils/errors');
const { getPagination, getPaginationMeta } = require('../../utils/pagination');
const emailService = require('../notifications/email.service');

// ── Función privada: recalcula los totales de una cotización ───────────────
const recalcularTotales = async (quoteId) => {
  const items = await QuoteItem.findAll({ where: { quote_id: quoteId } });
  if (!items || items.length === 0) {
    const quote = await Quote.findByPk(quoteId);
    await quote.update({ subtotal: 0, iva_monto: 0, total: 0 });
    return quote;
  }

  const subtotal = items.reduce(
    (acc, item) => acc + parseFloat(item.subtotal), 0
  );

  const quote = await Quote.findByPk(quoteId);

  // Aplicamos descuento extra si lo hay
  const baseConDescuento = subtotal * (1 - parseFloat(quote.descuento_extra) / 100);

  // Calculamos IVA
  const ivaMonto = baseConDescuento * (parseFloat(quote.iva_porcentaje) / 100);
  const total    = baseConDescuento + ivaMonto;

  await quote.update({
    subtotal:  Math.round(subtotal * 100) / 100,
    iva_monto: Math.round(ivaMonto * 100) / 100,
    total:     Math.round(total * 100) / 100,
  });

  return quote;
};
// ── Función privada: verifica si una cotización ha vencido ────────────────
const verificarVencimiento = async (quoteId) => {
  const quote = await Quote.findByPk(quoteId);
  if (!quote) return;

  const hoy = new Date().toISOString().split('T')[0];
  if (quote.estado === 'aprobada' && quote.fecha_vencimiento < hoy) {
    await quote.update({ estado: 'vencida' });
  }
};

// ── Crear cotización ───────────────────────────────────────────────────────
const crearCotizacion = async (userId, companyId, data) => {
  // Verificamos que la empresa exista y esté activa
  const empresa = await Company.findOne({ where: { id: companyId, activa: true } });
  if (!empresa) throw errors.notFound('Empresa');

  // Creamos la cotización vacía
  const cotizacion = await Quote.create({
    company_id:            companyId,
    created_by:            userId,
    observaciones_cliente: data.observaciones_cliente,
    iva_porcentaje:        empresa.condicion_iva === 'exento' ? 0 : 21,
  });

  // Agregamos los ítems si vinieron en el request
  if (data.items && data.items.length > 0) {
    await agregarItems(cotizacion.id, companyId, data.items);
  }

  return getCotizacionPorId(cotizacion.id);
};

// ── Agregar ítems a una cotización ─────────────────────────────────────────
const agregarItems = async (quoteId, companyId, items) => {
  const cotizacion = await Quote.findByPk(quoteId);
  if (!cotizacion) throw errors.notFound('Cotización');

  // Solo se pueden modificar cotizaciones en borrador
  if (cotizacion.estado !== 'borrador') {
    throw errors.badRequest('Solo se pueden modificar cotizaciones en borrador');
  }

  // Procesamos cada ítem
  for (const item of items) {
    const producto = await Product.findByPk(item.product_id);
    if (!producto) throw errors.notFound(`Producto ID ${item.product_id}`);

    // Validamos stock disponible
    if (producto.stock_actual < item.cantidad) {
      throw errors.badRequest(
        `Stock insuficiente para "${producto.nombre}". Disponible: ${producto.stock_actual}`
      );
    }

    // Calculamos el precio según la lista de la empresa
    const precio = await calcularPrecio(item.product_id, companyId, item.cantidad);

    // Si el ítem ya existe en la cotización, actualizamos la cantidad
    const itemExistente = await QuoteItem.findOne({
      where: { quote_id: quoteId, product_id: item.product_id }
    });

    const subtotal = Math.round(precio.precio_final * item.cantidad * 100) / 100;

    if (itemExistente) {
      await itemExistente.update({
        cantidad:           item.cantidad,
        precio_unitario:    precio.precio_final,
        descuento_aplicado: precio.descuento_aplicado,
        subtotal,
      });
    } else {
      await QuoteItem.create({
        quote_id:           quoteId,
        product_id:         item.product_id,
        cantidad:           item.cantidad,
        precio_unitario:    precio.precio_final,
        descuento_aplicado: precio.descuento_aplicado,
        subtotal,
        nombre_producto:    producto.nombre,
        sku_producto:       producto.sku,
      });
    }
  }

  // Recalculamos totales después de agregar todos los ítems
  return recalcularTotales(quoteId);
};

// ── Eliminar ítem de una cotización ───────────────────────────────────────
const eliminarItem = async (quoteId, itemId) => {
  const cotizacion = await Quote.findByPk(quoteId);
  if (!cotizacion) throw errors.notFound('Cotización');
  if (cotizacion.estado !== 'borrador') {
    throw errors.badRequest('Solo se pueden modificar cotizaciones en borrador');
  }

  const item = await QuoteItem.findOne({ where: { id: itemId, quote_id: quoteId } });
  if (!item) throw errors.notFound('Ítem');

  await item.destroy();
  return recalcularTotales(quoteId);
};

// ── Enviar cotización para revisión ───────────────────────────────────────
const enviarCotizacion = async (quoteId, userId) => {
  const cotizacion = await Quote.findByPk(quoteId, {
    include: [{ model: QuoteItem, as: 'items' }]
  });
  if (!cotizacion) throw errors.notFound('Cotización');
  if (cotizacion.created_by !== userId) throw errors.forbidden();
  if (cotizacion.estado !== 'borrador') {
    throw errors.badRequest('Solo se pueden enviar cotizaciones en borrador');
  }
  if (!cotizacion.items || cotizacion.items.length === 0) {
    throw errors.badRequest('La cotización no tiene productos');
  }

  await cotizacion.update({ estado: 'pendiente' });
  const cotizacionCompleta = await getCotizacionPorId(quoteId);

await emailService.enviarCotizacionRecibida({
  email:      cotizacionCompleta.creador.email,
  nombre:     cotizacionCompleta.creador.nombre,
  cotizacion: cotizacionCompleta,
});

  return getCotizacionPorId(quoteId);
};

// ── Aprobar cotización (vendedor/admin) ────────────────────────────────────
const aprobarCotizacion = async (quoteId, reviewerId, data = {}) => {
  const cotizacion = await Quote.findByPk(quoteId);
  if (!cotizacion) throw errors.notFound('Cotización');
  if (cotizacion.estado !== 'pendiente') {
    throw errors.badRequest('Solo se pueden aprobar cotizaciones pendientes');
  }

  await cotizacion.update({
    estado:          'aprobada',
    reviewed_by:     reviewerId,
    nota_vendedor:   data.nota_vendedor,
    descuento_extra: data.descuento_extra || cotizacion.descuento_extra,
  });

  // Recalculamos por si el vendedor cambió el descuento extra
  await recalcularTotales(quoteId);

const aprobada = await getCotizacionPorId(quoteId);
await emailService.enviarCotizacionAprobada({
  email:      aprobada.creador.email,
  nombre:     aprobada.creador.nombre,
  cotizacion: aprobada,
});

  return getCotizacionPorId(quoteId);
};

// ── Rechazar cotización (vendedor/admin) ───────────────────────────────────
const rechazarCotizacion = async (quoteId, reviewerId, motivo) => {
  const cotizacion = await Quote.findByPk(quoteId);
  if (!cotizacion) throw errors.notFound('Cotización');
  if (cotizacion.estado !== 'pendiente') {
    throw errors.badRequest('Solo se pueden rechazar cotizaciones pendientes');
  }
  if (!motivo) throw errors.badRequest('Debe indicar el motivo del rechazo');

  await cotizacion.update({
    estado:          'rechazada',
    reviewed_by:     reviewerId,
    motivo_rechazo:  motivo,
  });

  return getCotizacionPorId(quoteId);
};

// ── Listar cotizaciones ────────────────────────────────────────────────────
const getCotizaciones = async (user, query) => {
  const { page, limit, offset } = getPagination(query);
  const where = {};

  // Los clientes solo ven sus propias cotizaciones
  if (user.rol === 'cliente') where.company_id = user.company_id;

  // Filtros opcionales
  if (query.estado)     where.estado     = query.estado;
  if (query.company_id && user.rol !== 'cliente') where.company_id = query.company_id;

  const { count, rows } = await Quote.findAndCountAll({
    where,
    include: [
      { model: QuoteItem, as: 'items' },
      { model: Company, as: 'empresa', attributes: ['id', 'razon_social'] },
    ],
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });

  return {
    cotizaciones: rows,
    paginacion:   getPaginationMeta(count, page, limit),
  };
};

// ── Obtener cotización por ID ──────────────────────────────────────────────
const getCotizacionPorId = async (id) => {
  const cotizacion = await Quote.findByPk(id, {
    include: [
      {
        model: QuoteItem,
        as: 'items',
        include: [{ model: Product, as: 'producto', attributes: ['id', 'sku', 'nombre', 'stock_actual'] }],
      },
      { model: Company, as: 'empresa' },
      { model: require('../users/user.model'), as: 'creador',  attributes: ['id', 'nombre', 'apellido', 'email'] },
      { model: require('../users/user.model'), as: 'revisor',  attributes: ['id', 'nombre', 'apellido'] },
    ],
  });
  if (!cotizacion) throw errors.notFound('Cotización');
  return cotizacion;
};

module.exports = {
  crearCotizacion,
  agregarItems,
  eliminarItem,
  enviarCotizacion,
  aprobarCotizacion,
  rechazarCotizacion,
  getCotizaciones,
  getCotizacionPorId,
};