// src/modules/pricing/pricing.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const Product   = require('../catalog/product.model');

// ── Modelo 1: Lista de precios ─────────────────────────────────────────────
// Representa una lista completa, ej: "Lista Distribuidores A", "Lista Minoristas"
const PriceList = sequelize.define('PriceList', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    set(value) { this.setDataValue('nombre', value.trim()); }
  },

  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // Porcentaje de descuento global que aplica a TODOS los productos
  // de esta lista sobre el precio_lista base del producto.
  // Ej: descuento_global = 10 → todos los productos tienen 10% de descuento
  // Este valor se usa cuando un producto no tiene precio específico en la lista.
  descuento_global: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    validate: { min: 0, max: 100 }
  },

  // Moneda (preparado para multi-moneda en el futuro)
  moneda: {
    type: DataTypes.ENUM('ARS', 'USD'),
    defaultValue: 'ARS',
  },

  activa: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },

}, {
  tableName: 'price_lists',
  timestamps: true,
  underscored: true,
});


// ── Modelo 2: Ítem de lista de precios ────────────────────────────────────
// Representa el precio de UN producto específico dentro de UNA lista.
// Si un producto no tiene ítem en la lista, se usa el descuento_global.
const PriceListItem = sequelize.define('PriceListItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  price_list_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: PriceList, key: 'id' }
  },

  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Product, key: 'id' }
  },

  // Precio final para este producto en esta lista.
  // Si está seteado, tiene prioridad sobre el descuento_global.
  precio: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: { min: 0 }
  },

  // Descuentos por volumen: el cliente paga menos si compra más.
  // Se guarda como JSON: [{ cantidad: 10, descuento: 5 }, { cantidad: 50, descuento: 10 }]
  // Significa: comprando 10+ unidades → 5% off, comprando 50+ → 10% off
  descuentos_volumen: {
    type: DataTypes.JSON,
    defaultValue: [],
  },

  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },

}, {
  tableName: 'price_list_items',
  timestamps: true,
  underscored: true,
  // Índice único: un producto no puede aparecer dos veces en la misma lista
  indexes: [{
    unique: true,
    fields: ['price_list_id', 'product_id'],
  }],
});

// ── Relaciones ─────────────────────────────────────────────────────────────
PriceList.hasMany(PriceListItem, { foreignKey: 'price_list_id', as: 'items' });
PriceListItem.belongsTo(PriceList, { foreignKey: 'price_list_id', as: 'lista' });

PriceListItem.belongsTo(Product, { foreignKey: 'product_id', as: 'producto' });
Product.hasMany(PriceListItem, { foreignKey: 'product_id', as: 'precios' });

module.exports = { PriceList, PriceListItem };