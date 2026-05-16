// src/modules/notifications/n8n.service.js
const N8N_WEBHOOK_BASE = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook';

// Función base para llamar a n8n
const notificar = async (evento, datos) => {
    try {
        const res = await fetch(`${N8N_WEBHOOK_BASE}/${evento}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos),
        });

        if (res.ok) {
            console.log(`\x1b[32m[n8n]\x1b[0m Evento "${evento}" enviado correctamente`);
        } else {
            console.error(`\x1b[31m[n8n]\x1b[0m Error en evento "${evento}":`, res.status);
        }
    } catch (error) {
        // No propagamos el error — si n8n falla el flujo principal no se rompe
        console.error(`\x1b[31m[n8n]\x1b[0m No se pudo conectar con n8n:`, error.message);
    }
};

// ── Eventos específicos ────────────────────────────────────────

const notificarRegistro = (empresa, usuario) =>
    notificar('registro', {
        tipo: 'registro',
        empresa: empresa.razon_social,
        cuit: empresa.cuit,
        nombre: `${usuario.nombre} ${usuario.apellido}`,
        email: usuario.email,
        ciudad: empresa.ciudad,
        provincia: empresa.provincia,
        fecha: new Date().toLocaleDateString('es-AR'),
    });

const notificarCotizacionAprobada = (cotizacion, empresa, usuario) =>
    notificar('cotizacion-aprobada', {
        tipo: 'cotizacion_aprobada',
        numero: cotizacion.numero,
        empresa: empresa?.razon_social,
        email_cliente: usuario?.email,
        nombre_cliente: `${usuario?.nombre} ${usuario?.apellido}`,
        total: cotizacion.total,
        nota_vendedor: cotizacion.nota_vendedor,
        fecha: new Date().toLocaleDateString('es-AR'),
    });

const notificarCotizacionRechazada = (cotizacion, empresa, usuario) =>
    notificar('cotizacion-rechazada', {
        tipo: 'cotizacion_rechazada',
        numero: cotizacion.numero,
        empresa: empresa?.razon_social,
        email_cliente: usuario?.email,
        nombre_cliente: `${usuario?.nombre} ${usuario?.apellido}`,
        motivo: cotizacion.motivo_rechazo,
        fecha: new Date().toLocaleDateString('es-AR'),
    });

const notificarPedidoDespachado = (pedido, empresa) =>
    notificar('pedido-despachado', {
        tipo: 'pedido_despachado',
        numero: pedido.numero,
        empresa: empresa?.razon_social,
        email_cliente: empresa?.email_contacto,
        numero_remito: pedido.numero_remito,
        numero_factura: pedido.numero_factura,
        direccion: pedido.direccion_entrega,
        total: pedido.total,
        fecha: new Date().toLocaleDateString('es-AR'),
    });

module.exports = {
    notificarRegistro,
    notificarCotizacionAprobada,
    notificarCotizacionRechazada,
    notificarPedidoDespachado,
};