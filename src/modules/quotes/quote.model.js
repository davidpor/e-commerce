// src/modules/quotes/quote.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const User    = require('../users/user.model');
const Company = require('../users/company.model');
const Product = require('../catalog/product.model');

// ── Modelo 1: Cotización ───────────────────────────────────────────────────
const Quote = sequelize.define('Quote', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  // Número legible para mostrar al cliente: COT-2026-00001
  numero: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: true, // se genera automáticamente antes de guardar
  },

  // Estados posibles de la cotización
  // borrador   → el cliente la está armando, no la envió
  // pendiente  → el cliente la envió, espera revisión del vendedor
  // aprobada   → el vendedor la aprobó, lista para convertir en pedido
  // rechazada  → el vendedor la rechazó con un motivo
  // vencida    → pasaron más de X días sin convertirse en pedido
  // convertida → ya se convirtió en pedido
  estado: {
    type: DataTypes.ENUM(
      'borrador', 'pendiente', 'aprobada', 
      'rechazada', 'vencida', 'convertida'
    ),
    defaultValue: 'borrador',
  },

  // Total calculado al momento de crear/actualizar
  subtotal: {
    type: DataTypes.DECIMAL(14, 2),
    defaultValue: 0.00,
  },

  // IVA (21% por defecto para responsables inscriptos)
  iva_porcentaje: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 21.00,
  },

  iva_monto: {
    type: DataTypes.DECIMAL(14, 2),
    defaultValue: 0.00,
  },

  total: {
    type: DataTypes.DECIMAL(14, 2),
    defaultValue: 0.00,
  },

  // Descuento adicional que el vendedor puede aplicar sobre el total
  descuento_extra: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
  },

  // Observaciones del cliente al crear la cotización
  observaciones_cliente: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // Nota interna del vendedor (no la ve el cliente)
  nota_vendedor: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // Motivo si fue rechazada
  motivo_rechazo: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // Fecha en que vence la cotización (validez de precios)
  fecha_vencimiento: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },

  // ID del pedido generado al convertir (referencia cruzada)
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  // Claves foráneas
  company_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Company, key: 'id' }
  },

  // Usuario que creó la cotización
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: User, key: 'id' }
  },

  // Vendedor que la aprobó/rechazó
  reviewed_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: User, key: 'id' }
  },

}, {
  tableName: 'quotes',
  timestamps: true,
  underscored: true,
  hooks: {
    // Generamos el número de cotización antes de crear
    beforeCreate: async (quote) => {
      const año     = new Date().getFullYear();
      const count   = await Quote.count();
      const numero  = String(count + 1).padStart(5, '0');
      quote.numero  = `COT-${año}-${numero}`;

      // La cotización vence en 15 días por defecto
      if (!quote.fecha_vencimiento) {
        const vence = new Date();
        vence.setDate(vence.getDate() + 15);
        quote.fecha_vencimiento = vence.toISOString().split('T')[0];
      }
    },
  },
});

// ── Modelo 2: Ítem de cotización ───────────────────────────────────────────
const QuoteItem = sequelize.define('QuoteItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  quote_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Quote, key: 'id' }
  },

  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Product, key: 'id' }
  },

  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1 }
  },

  // Precio unitario al momento de cotizar (precio histórico)
  // Si el precio cambia después, la cotización mantiene el precio original
  precio_unitario: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },

  descuento_aplicado: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
  },

  subtotal: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: false,
  },

  // Snapshot del nombre del producto (por si cambia después)
  nombre_producto: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },

  sku_producto: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },

}, {
  tableName: 'quote_items',
  timestamps: true,
  underscored: true,
});

// ── Relaciones ─────────────────────────────────────────────────────────────
Quote.hasMany(QuoteItem, { foreignKey: 'quote_id', as: 'items' });
QuoteItem.belongsTo(Quote, { foreignKey: 'quote_id', as: 'cotizacion' });

QuoteItem.belongsTo(Product, { foreignKey: 'product_id', as: 'producto' });
Quote.belongsTo(Company, { foreignKey: 'company_id', as: 'empresa' });
Quote.belongsTo(User, { foreignKey: 'created_by', as: 'creador' });
Quote.belongsTo(User, { foreignKey: 'reviewed_by', as: 'revisor' });

module.exports = { Quote, QuoteItem };