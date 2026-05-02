// src/modules/notifications/templates.js
// Plantillas HTML de los emails. Usamos HTML inline porque
// muchos clientes de email no cargan CSS externo.

// Función base: genera el wrapper HTML común a todos los emails
const layout = (contenido, titulo) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titulo}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" 
               style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color:#1a1a2e;padding:30px 40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:bold;">
                Ferretería B2B
              </h1>
              <p style="color:#a0a0c0;margin:4px 0 0;font-size:13px;">
                Sistema mayorista de insumos
              </p>
            </td>
          </tr>

          <!-- Contenido -->
          <tr>
            <td style="padding:40px;">
              ${contenido}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8f8f8;padding:20px 40px;text-align:center;
                        border-top:1px solid #eeeeee;">
              <p style="color:#999999;font-size:12px;margin:0;">
                Este es un email automático. Por favor no respondas este mensaje.
              </p>
              <p style="color:#999999;font-size:12px;margin:4px 0 0;">
                © ${new Date().getFullYear()} Ferretería B2B — Mendoza, Argentina
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// ── Helper: botón CTA ──────────────────────────────────────────────────────
const boton = (texto, url) => `
  <div style="text-align:center;margin:30px 0;">
    <a href="${url}" 
       style="background-color:#1a1a2e;color:#ffffff;padding:14px 32px;
              text-decoration:none;border-radius:6px;font-size:15px;
              font-weight:bold;display:inline-block;">
      ${texto}
    </a>
  </div>
`;

// ── Helper: tabla de productos ─────────────────────────────────────────────
const tablaProductos = (items) => `
  <table width="100%" cellpadding="0" cellspacing="0" 
         style="border-collapse:collapse;margin:20px 0;">
    <thead>
      <tr style="background-color:#f0f0f0;">
        <th style="padding:10px 12px;text-align:left;font-size:13px;color:#555;">Producto</th>
        <th style="padding:10px 12px;text-align:center;font-size:13px;color:#555;">Cant.</th>
        <th style="padding:10px 12px;text-align:right;font-size:13px;color:#555;">Precio unit.</th>
        <th style="padding:10px 12px;text-align:right;font-size:13px;color:#555;">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((item, i) => `
        <tr style="background-color:${i % 2 === 0 ? '#ffffff' : '#fafafa'};">
          <td style="padding:10px 12px;font-size:13px;color:#333;border-bottom:1px solid #eee;">
            <strong>${item.nombre_producto || item.nombre}</strong><br>
            <span style="color:#888;font-size:11px;">SKU: ${item.sku_producto || item.sku}</span>
          </td>
          <td style="padding:10px 12px;text-align:center;font-size:13px;color:#333;border-bottom:1px solid #eee;">
            ${item.cantidad}
          </td>
          <td style="padding:10px 12px;text-align:right;font-size:13px;color:#333;border-bottom:1px solid #eee;">
            $${parseFloat(item.precio_unitario).toLocaleString('es-AR')}
          </td>
          <td style="padding:10px 12px;text-align:right;font-size:13px;color:#333;border-bottom:1px solid #eee;">
            $${parseFloat(item.subtotal).toLocaleString('es-AR')}
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>
`;

// ── Helper: resumen de totales ─────────────────────────────────────────────
const resumenTotales = (data) => `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;">
    <tr>
      <td style="padding:6px 12px;text-align:right;font-size:13px;color:#666;">Subtotal:</td>
      <td style="padding:6px 12px;text-align:right;font-size:13px;color:#333;width:120px;">
        $${parseFloat(data.subtotal).toLocaleString('es-AR')}
      </td>
    </tr>
    ${parseFloat(data.descuento_extra) > 0 ? `
    <tr>
      <td style="padding:6px 12px;text-align:right;font-size:13px;color:#666;">
        Descuento (${data.descuento_extra}%):
      </td>
      <td style="padding:6px 12px;text-align:right;font-size:13px;color:#e74c3c;">
        -$${(parseFloat(data.subtotal) * parseFloat(data.descuento_extra) / 100).toLocaleString('es-AR')}
      </td>
    </tr>` : ''}
    <tr>
      <td style="padding:6px 12px;text-align:right;font-size:13px;color:#666;">
        IVA (${data.iva_porcentaje}%):
      </td>
      <td style="padding:6px 12px;text-align:right;font-size:13px;color:#333;">
        $${parseFloat(data.iva_monto).toLocaleString('es-AR')}
      </td>
    </tr>
    <tr style="border-top:2px solid #333;">
      <td style="padding:10px 12px;text-align:right;font-size:16px;font-weight:bold;color:#333;">
        TOTAL:
      </td>
      <td style="padding:10px 12px;text-align:right;font-size:16px;font-weight:bold;color:#1a1a2e;">
        $${parseFloat(data.total).toLocaleString('es-AR')}
      </td>
    </tr>
  </table>
`;

// ══════════════════════════════════════════════════════════════════════════════
// TEMPLATES ESPECÍFICOS
// ══════════════════════════════════════════════════════════════════════════════

const bienvenida = ({ nombre, razonSocial }) => ({
  subject: `Bienvenido a Ferretería B2B — ${razonSocial}`,
  html: layout(`
    <h2 style="color:#1a1a2e;margin:0 0 16px;">¡Registro exitoso!</h2>
    <p style="color:#555;font-size:15px;line-height:1.6;">
      Hola <strong>${nombre}</strong>, tu empresa <strong>${razonSocial}</strong> 
      fue registrada correctamente en nuestro sistema mayorista.
    </p>
    <div style="background:#fff8e1;border-left:4px solid #f9a825;padding:16px;border-radius:4px;margin:20px 0;">
      <p style="margin:0;color:#795548;font-size:14px;">
        <strong>⏳ Cuenta en revisión</strong><br>
        Nuestro equipo comercial revisará tu solicitud y activará tu cuenta 
        en las próximas 24 horas hábiles. Te avisaremos por email.
      </p>
    </div>
    <p style="color:#555;font-size:14px;">
      Si tenés alguna consulta podés contactarnos respondiendo este email 
      o llamando al <strong>(0261) 400-1234</strong>.
    </p>
  `, 'Bienvenido'),
});

const cuentaActivada = ({ nombre, razonSocial, frontendUrl }) => ({
  subject: `Tu cuenta fue activada — Ya podés comprar en Ferretería B2B`,
  html: layout(`
    <h2 style="color:#1a1a2e;margin:0 0 16px;">✅ ¡Tu cuenta está activa!</h2>
    <p style="color:#555;font-size:15px;line-height:1.6;">
      Hola <strong>${nombre}</strong>, la cuenta de <strong>${razonSocial}</strong> 
      fue aprobada. Ya podés ingresar al catálogo y realizar pedidos.
    </p>
    ${boton('Ir al catálogo', `${frontendUrl}/catalogo`)}
  `, 'Cuenta activada'),
});

const cotizacionRecibida = ({ nombre, cotizacion }) => ({
  subject: `Cotización ${cotizacion.numero} recibida — En revisión`,
  html: layout(`
    <h2 style="color:#1a1a2e;margin:0 0 8px;">Cotización recibida</h2>
    <p style="color:#888;font-size:13px;margin:0 0 20px;">N° ${cotizacion.numero}</p>
    <p style="color:#555;font-size:15px;line-height:1.6;">
      Hola <strong>${nombre}</strong>, recibimos tu solicitud de cotización. 
      Nuestro equipo la revisará y te responderemos a la brevedad.
    </p>
    <div style="background:#e8f5e9;border-left:4px solid #4caf50;padding:16px;border-radius:4px;margin:20px 0;">
      <p style="margin:0;color:#2e7d32;font-size:14px;">
        <strong>Vencimiento de precios:</strong> ${cotizacion.fecha_vencimiento}
      </p>
    </div>
    ${tablaProductos(cotizacion.items)}
    ${resumenTotales(cotizacion)}
  `, `Cotización ${cotizacion.numero}`),
});

const cotizacionAprobada = ({ nombre, cotizacion, frontendUrl }) => ({
  subject: `✅ Cotización ${cotizacion.numero} aprobada — Podés confirmar tu pedido`,
  html: layout(`
    <h2 style="color:#1a1a2e;margin:0 0 8px;">¡Cotización aprobada!</h2>
    <p style="color:#888;font-size:13px;margin:0 0 20px;">N° ${cotizacion.numero}</p>
    <p style="color:#555;font-size:15px;line-height:1.6;">
      Hola <strong>${nombre}</strong>, tu cotización fue aprobada. 
      Podés confirmarla como pedido desde el sistema.
    </p>
    ${cotizacion.nota_vendedor ? `
    <div style="background:#e3f2fd;border-left:4px solid #2196f3;padding:16px;border-radius:4px;margin:20px 0;">
      <p style="margin:0;color:#0d47a1;font-size:14px;">
        <strong>Nota del vendedor:</strong><br>${cotizacion.nota_vendedor}
      </p>
    </div>` : ''}
    ${tablaProductos(cotizacion.items)}
    ${resumenTotales(cotizacion)}
    ${boton('Confirmar pedido', `${frontendUrl}/cotizaciones/${cotizacion.id}`)}
  `, `Cotización ${cotizacion.numero} aprobada`),
});

const cotizacionRechazada = ({ nombre, cotizacion }) => ({
  subject: `Cotización ${cotizacion.numero} — Necesita revisión`,
  html: layout(`
    <h2 style="color:#1a1a2e;margin:0 0 8px;">Cotización observada</h2>
    <p style="color:#888;font-size:13px;margin:0 0 20px;">N° ${cotizacion.numero}</p>
    <p style="color:#555;font-size:15px;line-height:1.6;">
      Hola <strong>${nombre}</strong>, tu cotización fue observada por nuestro equipo.
    </p>
    <div style="background:#fce4ec;border-left:4px solid #e91e63;padding:16px;border-radius:4px;margin:20px 0;">
      <p style="margin:0;color:#880e4f;font-size:14px;">
        <strong>Motivo:</strong><br>${cotizacion.motivo_rechazo}
      </p>
    </div>
    <p style="color:#555;font-size:14px;">
      Podés crear una nueva cotización con las modificaciones necesarias 
      o contactar a tu vendedor asignado.
    </p>
  `, `Cotización ${cotizacion.numero}`),
});

const pedidoConfirmado = ({ nombre, pedido, frontendUrl }) => ({
  subject: `Pedido ${pedido.numero} confirmado — En proceso`,
  html: layout(`
    <h2 style="color:#1a1a2e;margin:0 0 8px;">Pedido confirmado</h2>
    <p style="color:#888;font-size:13px;margin:0 0 20px;">N° ${pedido.numero}</p>
    <p style="color:#555;font-size:15px;line-height:1.6;">
      Hola <strong>${nombre}</strong>, tu pedido fue confirmado y está 
      siendo procesado por nuestro depósito.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" 
           style="background:#f8f8f8;border-radius:6px;padding:16px;margin:20px 0;">
      <tr>
        <td style="font-size:13px;color:#666;padding:4px 0;">Método de pago:</td>
        <td style="font-size:13px;color:#333;text-align:right;padding:4px 0;">
          ${pedido.metodo_pago.replace('_', ' ').toUpperCase()}
        </td>
      </tr>
      <tr>
        <td style="font-size:13px;color:#666;padding:4px 0;">Dirección de entrega:</td>
        <td style="font-size:13px;color:#333;text-align:right;padding:4px 0;">
          ${pedido.direccion_entrega || 'A coordinar'}
        </td>
      </tr>
    </table>
    ${tablaProductos(pedido.items)}
    ${resumenTotales(pedido)}
    ${boton('Ver estado del pedido', `${frontendUrl}/pedidos/${pedido.id}`)}
  `, `Pedido ${pedido.numero}`),
});

const pedidoDespachado = ({ nombre, pedido }) => ({
  subject: `🚚 Pedido ${pedido.numero} despachado — En camino`,
  html: layout(`
    <h2 style="color:#1a1a2e;margin:0 0 8px;">Tu pedido está en camino</h2>
    <p style="color:#888;font-size:13px;margin:0 0 20px;">N° ${pedido.numero}</p>
    <p style="color:#555;font-size:15px;line-height:1.6;">
      Hola <strong>${nombre}</strong>, tu pedido fue despachado desde nuestro depósito.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" 
           style="background:#f8f8f8;border-radius:6px;padding:16px;margin:20px 0;">
      ${pedido.numero_remito ? `
      <tr>
        <td style="font-size:13px;color:#666;padding:4px 0;">N° de remito:</td>
        <td style="font-size:13px;color:#333;text-align:right;padding:4px 0;font-weight:bold;">
          ${pedido.numero_remito}
        </td>
      </tr>` : ''}
      ${pedido.numero_factura ? `
      <tr>
        <td style="font-size:13px;color:#666;padding:4px 0;">N° de factura:</td>
        <td style="font-size:13px;color:#333;text-align:right;padding:4px 0;font-weight:bold;">
          ${pedido.numero_factura}
        </td>
      </tr>` : ''}
      <tr>
        <td style="font-size:13px;color:#666;padding:4px 0;">Dirección de entrega:</td>
        <td style="font-size:13px;color:#333;text-align:right;padding:4px 0;">
          ${pedido.direccion_entrega || 'A coordinar'}
        </td>
      </tr>
    </table>
    <p style="color:#555;font-size:14px;">
      Ante cualquier consulta sobre la entrega, contactá a tu vendedor 
      con el número de remito indicado.
    </p>
  `, `Pedido ${pedido.numero} despachado`),
});

module.exports = {
  bienvenida,
  cuentaActivada,
  cotizacionRecibida,
  cotizacionAprobada,
  cotizacionRechazada,
  pedidoConfirmado,
  pedidoDespachado,
};