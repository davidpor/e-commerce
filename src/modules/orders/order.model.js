// src/modules/orders/order.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const User    = require('../users/user.model');
const Company = require('../users/company.model');
const Product = require('../catalog/product.model');

// ── Modelo 1: Pedido ───────────────────────────────────────────────────────
const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  // Número legible: PED-2026-00001
  numero: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: true,
  },

  estado: {
    type: DataTypes.ENUM(
      'confirmado',
      'en_preparacion',
      'despachado',
      'entregado',
      'cancelado'
    ),
    defaultValue: 'confirmado',
  },

  // Método de pago elegido por el cliente
  metodo_pago: {
    type: DataTypes.ENUM(
      'transferencia',
      'cheque',
      'cuenta_corriente',
      'mercado_pago',
      'efectivo'
    ),
    allowNull: false,
  },

  // Estado del pago (independiente del estado del pedido)
  estado_pago: {
    type: DataTypes.ENUM('pendiente', 'pagado', 'parcial'),
    defaultValue: 'pendiente',
  },

  // Totales (copiados de la cotización al momento de crear)
  subtotal: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: false,
  },

  descuento_extra: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
  },

  iva_porcentaje: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 21.00,
  },

  iva_monto: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: false,
  },

  total: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: false,
  },

  // Dirección de entrega (puede ser diferente a la de la empresa)
  direccion_entrega: {
    type: DataTypes.STRING(400),
    allowNull: true,
  },

  // Número de remito asignado por el depósito
  numero_remito: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },

  // Número de factura emitida
  numero_factura: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },

  // Observaciones del cliente
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // Notas internas del vendedor
  notas_internas: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // Motivo si fue cancelado
  motivo_cancelacion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // Fechas clave del ciclo de vida
  fecha_confirmacion:   { type: DataTypes.DATE, allowNull: true },
  fecha_preparacion:    { type: DataTypes.DATE, allowNull: true },
  fecha_despacho:       { type: DataTypes.DATE, allowNull: true },
  fecha_entrega:        { type: DataTypes.DATE, allowNull: true },
  fecha_cancelacion:    { type: DataTypes.DATE, allowNull: true },

  // Referencias
  quote_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // puede crearse sin cotización previa (desde backoffice)
  },

  company_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Company, key: 'id' }
  },

  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: User, key: 'id' }
  },

  // Vendedor asignado al pedido
  assigned_to: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: User, key: 'id' }
  },

}, {
  tableName: 'orders',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeCreate: async (order) => {
      const año    = new Date().getFullYear();
      const count  = await Order.count();
      const numero = String(count + 1).padStart(5, '0');
      order.numero = `PED-${año}-${numero}`;
      order.fecha_confirmacion = new Date();
    },
  },
});

// ── Modelo 2: Ítem de pedido ───────────────────────────────────────────────
const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Order, key: 'id' }
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

  // Precio al momento del pedido (histórico, no cambia)
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

  // Snapshot del producto
  nombre_producto: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },

  sku_producto: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },

}, {
  tableName: 'order_items',
  timestamps: true,
  underscored: true,
});

// ── Modelo 3: Historial de estados ────────────────────────────────────────
// Registra cada cambio de estado con fecha, usuario y nota.
// Permite ver el historial completo de un pedido.
const OrderStatusLog = sequelize.define('OrderStatusLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  estado_anterior: {
    type: DataTypes.STRING(30),
    allowNull: true,
  },

  estado_nuevo: {
    type: DataTypes.STRING(30),
    allowNull: false,
  },

  nota: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  changed_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

}, {
  tableName: 'order_status_logs',
  timestamps: true,
  underscored: true,
});

// ── Relaciones ─────────────────────────────────────────────────────────────
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'pedido' });

OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'producto' });

Order.hasMany(OrderStatusLog, { foreignKey: 'order_id', as: 'historial' });

Order.belongsTo(Company, { foreignKey: 'company_id', as: 'empresa' });
Order.belongsTo(User, { foreignKey: 'created_by', as: 'creador' });
Order.belongsTo(User, { foreignKey: 'assigned_to', as: 'vendedor' });

module.exports = { Order, OrderItem, OrderStatusLog };