// src/modules/payments/payments.service.js
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const { Order } = require('../orders/order.model');
const { errors } = require('../../utils/errors');

// Inicializamos el cliente de Mercado Pago con nuestro access token
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
  options: {
    timeout: 5000, // timeout de 5 segundos para las llamadas a la API
  }
});

// ── Crear preferencia de pago ──────────────────────────────────────────────
// Una "preferencia" es básicamente el carrito de compra del lado de MP.
// Devuelve una URL (init_point) donde el cliente va a pagar.
const crearPreferencia = async (orderId, userId) => {
  const pedido = await Order.findByPk(orderId, {
    include: [
      { association: 'items' },
      { association: 'empresa' },
    ],
  });

  if (!pedido) throw errors.notFound('Pedido');

  // Solo se puede pagar con MP si el método de pago es mercado_pago
  if (pedido.metodo_pago !== 'mercado_pago') {
    throw errors.badRequest('Este pedido no usa Mercado Pago como método de pago');
  }

  // Solo pedidos pendientes de pago
  if (pedido.estado_pago === 'pagado') {
    throw errors.badRequest('Este pedido ya fue pagado');
  }

  // Armamos los ítems de la preferencia
  // MP requiere que cada ítem tenga título, cantidad y precio unitario
  const items = pedido.items.map(item => ({
    id:          item.product_id.toString(),
    title:       item.nombre_producto,
    description: `SKU: ${item.sku_producto}`,
    quantity:    item.cantidad,
    unit_price:  parseFloat(item.precio_unitario),
    currency_id: 'ARS',
  }));

  // Si hay descuento extra, lo agregamos como ítem negativo
  if (parseFloat(pedido.descuento_extra) > 0) {
    const montoDescuento = parseFloat(pedido.subtotal) * 
      (parseFloat(pedido.descuento_extra) / 100);
    items.push({
      id:          'descuento',
      title:       `Descuento ${pedido.descuento_extra}%`,
      quantity:    1,
      unit_price:  -Math.round(montoDescuento * 100) / 100,
      currency_id: 'ARS',
    });
  }

  const preference = new Preference(client);

  const response = await preference.create({
    body: {
      items,

      // Referencia externa: el ID de nuestro pedido
      // MP nos lo devuelve en el webhook para identificar el pago
      external_reference: orderId.toString(),

      // Datos del comprador (mejora la experiencia en el checkout)
      payer: {
        name:  pedido.empresa?.razon_social || '',
        email: pedido.empresa?.email_contacto || '',
      },

      // URLs de redirección después del pago
      back_urls: {
        success: `${process.env.FRONTEND_URL}/pedidos/${orderId}/pago-exitoso`,
        failure: `${process.env.FRONTEND_URL}/pedidos/${orderId}/pago-fallido`,
        pending: `${process.env.FRONTEND_URL}/pedidos/${orderId}/pago-pendiente`,
      },

      // MP redirige automáticamente al success/failure
      auto_return: 'approved',

      // URL donde MP nos avisa del resultado del pago (webhook)
      notification_url: `${process.env.API_URL}/api/payments/webhook`,

      // Vencimiento de la preferencia: 24 horas
      expiration_date_to: new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ).toISOString(),

      // Metadata adicional para debugging
      metadata: {
        order_id:   orderId,
        order_num:  pedido.numero,
        company_id: pedido.company_id,
      },

      // Medios de pago habilitados
      // En B2B evitamos efectivo y solo habilitamos tarjeta y transferencia
      payment_methods: {
        excluded_payment_types: [
          { id: 'ticket' } // excluimos pagos en efectivo (Rapipago, Pago Fácil)
        ],
        installments: 12, // hasta 12 cuotas
      },
    },
  });

  return {
    preference_id: response.id,
    init_point:    response.init_point,      // URL de pago para producción
    sandbox_url:   response.sandbox_init_point, // URL de pago para pruebas
    pedido_numero: pedido.numero,
    total:         pedido.total,
  };
};

// ── Procesar webhook de Mercado Pago ──────────────────────────────────────
// MP llama a esta URL cada vez que hay un cambio en el estado de un pago.
// Puede ser: aprobado, rechazado, en proceso, devuelto, etc.
const procesarWebhook = async (body, headers) => {
  const { type, data } = body;

  // MP envía diferentes tipos de notificaciones.
  // Solo nos interesan las de pagos.
  if (type !== 'payment') {
    return { mensaje: 'Notificación ignorada', type };
  }

  // Obtenemos los detalles completos del pago desde la API de MP
  const payment = new Payment(client);
  const pagoMP  = await payment.get({ id: data.id });

  const {
    status,            // approved, rejected, pending, in_process, refunded
    external_reference, // el ID de nuestro pedido
    transaction_amount, // monto cobrado
    id: mp_payment_id,  // ID del pago en MP
  } = pagoMP;

  const orderId = parseInt(external_reference);
  const pedido  = await Order.findByPk(orderId);

  if (!pedido) {
    console.error(`[MP Webhook] Pedido ${orderId} no encontrado`);
    return { error: 'Pedido no encontrado' };
  }

  console.log(`[MP Webhook] Pago ${mp_payment_id} para pedido ${orderId}: ${status}`);

  // Actualizamos el estado de pago según la respuesta de MP
  if (status === 'approved') {
    await pedido.update({ estado_pago: 'pagado' });
    console.log(`[MP Webhook] ✅ Pedido ${pedido.numero} pagado correctamente`);
  } else if (status === 'pending' || status === 'in_process') {
    await pedido.update({ estado_pago: 'parcial' });
  } else if (status === 'rejected' || status === 'refunded') {
    // En caso de rechazo/devolución dejamos el estado en pendiente
    await pedido.update({ estado_pago: 'pendiente' });
    console.log(`[MP Webhook] ❌ Pago rechazado para pedido ${pedido.numero}`);
  }

  return { recibido: true, payment_id: mp_payment_id, status };
};

// ── Consultar estado de pago de un pedido ─────────────────────────────────
const getEstadoPago = async (orderId) => {
  const pedido = await Order.findByPk(orderId, {
    attributes: ['id', 'numero', 'total', 'estado_pago', 'metodo_pago'],
  });
  if (!pedido) throw errors.notFound('Pedido');
  return pedido;
};

module.exports = { crearPreferencia, procesarWebhook, getEstadoPago };