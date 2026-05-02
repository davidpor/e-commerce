// src/modules/orders/orders.service.js
const { Order, OrderItem, OrderStatusLog } = require('./order.model');
const { Quote, QuoteItem } = require('../quotes/quote.model');
const Product = require('../catalog/product.model');
const Company = require('../users/company.model');
const { errors } = require('../../utils/errors');
const { getPagination, getPaginationMeta } = require('../../utils/pagination');
const emailService = require('../notifications/email.service');

// ── Función privada: registra cada cambio de estado ───────────────────────
const registrarCambioEstado = async (orderId, estadoAnterior, estadoNuevo, userId, nota) => {
  await OrderStatusLog.create({
    order_id:        orderId,
    estado_anterior: estadoAnterior,
    estado_nuevo:    estadoNuevo,
    nota:            nota || null,
    changed_by:      userId,
  });
};

// ── Función privada: trae el pedido completo ───────────────────────────────
const getPedidoCompleto = (id) => Order.findByPk(id, {
  include: [
    {
      model: OrderItem,
      as: 'items',
      include: [{
        model: Product,
        as: 'producto',
        attributes: ['id', 'sku', 'nombre', 'stock_actual', 'unidad_venta'],
      }],
    },
    { model: Company, as: 'empresa', attributes: ['id', 'razon_social', 'cuit'] },
    { model: require('../users/user.model'), as: 'creador',  attributes: ['id', 'nombre', 'apellido'] },
    { model: require('../users/user.model'), as: 'vendedor', attributes: ['id', 'nombre', 'apellido'] },
    { model: OrderStatusLog, as: 'historial', order: [['created_at', 'ASC']] },
  ],
});

// ── Crear pedido desde cotización aprobada ─────────────────────────────────
const crearDesdeCotizacion = async (quoteId, userId, data) => {
  const cotizacion = await Quote.findByPk(quoteId, {
    include: [{ model: QuoteItem, as: 'items' }],
  });

  if (!cotizacion) throw errors.notFound('Cotización');
  if (cotizacion.estado !== 'aprobada') {
    throw errors.badRequest('Solo se pueden convertir cotizaciones aprobadas en pedidos');
  }

  // Verificamos stock de todos los productos ANTES de crear el pedido
  // Si falta stock en alguno, fallamos completo (no a medias)
  for (const item of cotizacion.items) {
    const producto = await Product.findByPk(item.product_id);
    if (producto.stock_actual < item.cantidad) {
      throw errors.badRequest(
        `Stock insuficiente para "${item.nombre_producto}". ` +
        `Disponible: ${producto.stock_actual}, requerido: ${item.cantidad}`
      );
    }
  }

  // Creamos el pedido
  const pedido = await Order.create({
    quote_id:          quoteId,
    company_id:        cotizacion.company_id,
    created_by:        userId,
    metodo_pago:       data.metodo_pago,
    subtotal:          cotizacion.subtotal,
    descuento_extra:   cotizacion.descuento_extra,
    iva_porcentaje:    cotizacion.iva_porcentaje,
    iva_monto:         cotizacion.iva_monto,
    total:             cotizacion.total,
    direccion_entrega: data.direccion_entrega,
    observaciones:     data.observaciones || cotizacion.observaciones_cliente,
  });

  // Copiamos los ítems de la cotización al pedido
  for (const item of cotizacion.items) {
    await OrderItem.create({
      order_id:           pedido.id,
      product_id:         item.product_id,
      cantidad:           item.cantidad,
      precio_unitario:    item.precio_unitario,
      descuento_aplicado: item.descuento_aplicado,
      subtotal:           item.subtotal,
      nombre_producto:    item.nombre_producto,
      sku_producto:       item.sku_producto,
    });

    // Descontamos el stock inmediatamente al confirmar el pedido
    await Product.decrement('stock_actual', {
      by:    item.cantidad,
      where: { id: item.product_id },
    });
  }

  // Marcamos la cotización como convertida
  await cotizacion.update({
    estado:   'convertida',
    order_id: pedido.id,
  });

  // Registramos el primer cambio de estado en el historial
  await registrarCambioEstado(
    pedido.id, null, 'confirmado', userId,
    `Pedido creado desde cotización ${cotizacion.numero}`
  );

const pedidoCompleto = await getPedidoCompleto(pedido.id);
await emailService.enviarPedidoConfirmado({
  email:  pedidoCompleto.empresa.email_contacto,
  nombre: pedidoCompleto.creador.nombre,
  pedido: pedidoCompleto,
});

  return getPedidoCompleto(pedido.id);
};

// ── Máquina de estados ─────────────────────────────────────────────────────
// Define qué transiciones son válidas desde cada estado
const TRANSICIONES_VALIDAS = {
  confirmado:      ['en_preparacion', 'cancelado'],
  en_preparacion:  ['despachado', 'cancelado'],
  despachado:      ['entregado'],
  entregado:       [],   // estado final, no se puede mover
  cancelado:       [],   // estado final, no se puede mover
};

const cambiarEstado = async (orderId, nuevoEstado, userId, data = {}) => {
  const pedido = await Order.findByPk(orderId);
  if (!pedido) throw errors.notFound('Pedido');

  // Verificamos que la transición sea válida
  const transicionesPermitidas = TRANSICIONES_VALIDAS[pedido.estado] || [];
  if (!transicionesPermitidas.includes(nuevoEstado)) {
    throw errors.badRequest(
      `No se puede pasar de "${pedido.estado}" a "${nuevoEstado}". ` +
      `Transiciones válidas: ${transicionesPermitidas.join(', ') || 'ninguna'}`
    );
  }

  const estadoAnterior = pedido.estado;
  const actualizacion  = { estado: nuevoEstado };

  // Acciones específicas por estado
  if (nuevoEstado === 'en_preparacion') {
    actualizacion.fecha_preparacion = new Date();
  }

  if (nuevoEstado === 'despachado') {
    actualizacion.fecha_despacho  = new Date();
    actualizacion.numero_remito   = data.numero_remito;
    actualizacion.numero_factura  = data.numero_factura;
  }

  if (nuevoEstado === 'entregado') {
    actualizacion.fecha_entrega = new Date();
    actualizacion.estado_pago   = 'pagado'; // al entregar asumimos pago confirmado
  }

  if (nuevoEstado === 'cancelado') {
    actualizacion.fecha_cancelacion  = new Date();
    actualizacion.motivo_cancelacion = data.motivo;

    // Si se cancela antes de despachar, devolvemos el stock
    if (['confirmado', 'en_preparacion'].includes(estadoAnterior)) {
      const items = await OrderItem.findAll({ where: { order_id: orderId } });
      for (const item of items) {
        await Product.increment('stock_actual', {
          by:    item.cantidad,
          where: { id: item.product_id },
        });
      }
    }
  }

  await pedido.update(actualizacion);

  // Registramos el cambio en el historial
  await registrarCambioEstado(
    orderId, estadoAnterior, nuevoEstado, userId,
    data.nota || data.motivo || null
  );

  return getPedidoCompleto(orderId);
};

// ── Listar pedidos ─────────────────────────────────────────────────────────
const getPedidos = async (user, query) => {
  const { page, limit, offset } = getPagination(query);
  const where = {};

  // Clientes solo ven sus pedidos
  if (user.rol === 'cliente') where.company_id = user.company_id;

  if (query.estado)     where.estado     = query.estado;
  if (query.estado_pago) where.estado_pago = query.estado_pago;
  if (query.company_id && user.rol !== 'cliente') {
    where.company_id = query.company_id;
  }

  const { count, rows } = await Order.findAndCountAll({
    where,
    include: [
      { model: OrderItem, as: 'items' },
      { model: Company, as: 'empresa', attributes: ['id', 'razon_social'] },
    ],
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });

  return {
    pedidos:    rows,
    paginacion: getPaginationMeta(count, page, limit),
  };
};

const getPedidoPorId = async (id, user) => {
  const pedido = await getPedidoCompleto(id);
  if (!pedido) throw errors.notFound('Pedido');

  // Los clientes solo pueden ver sus propios pedidos
  if (user.rol === 'cliente' && pedido.company_id !== user.company_id) {
    throw errors.forbidden();
  }

  return pedido;
};

// ── Actualizar datos del pedido (remito, factura, notas) ──────────────────
const actualizarPedido = async (id, data) => {
  const pedido = await Order.findByPk(id);
  if (!pedido) throw errors.notFound('Pedido');

  const camposPermitidos = [
    'numero_remito', 'numero_factura',
    'notas_internas', 'direccion_entrega',
    'assigned_to', 'estado_pago',
  ];

  const actualizacion = {};
  camposPermitidos.forEach(campo => {
    if (data[campo] !== undefined) actualizacion[campo] = data[campo];
  });

  await pedido.update(actualizacion);
  return getPedidoCompleto(id);
};

module.exports = {
  crearDesdeCotizacion,
  cambiarEstado,
  getPedidos,
  getPedidoPorId,
  actualizarPedido,
};