// src/modules/catalog/product.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const Category = require('./category.model');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  // SKU = Stock Keeping Unit: código único del producto
  // Ej: "TOR-M8-ZI-100" (tornillo M8 zincado caja 100u)
  sku: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    set(value) {
      // Los SKUs siempre en mayúsculas para evitar duplicados
      this.setDataValue('sku', value.trim().toUpperCase());
    }
  },

  nombre: {
    type: DataTypes.STRING(200),
    allowNull: false,
    set(value) { this.setDataValue('nombre', value.trim()); }
  },

  // Descripción técnica detallada
  // Ej: "Tornillo cabeza hexagonal M8 x 40mm, zincado, DIN 933"
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  slug: {
    type: DataTypes.STRING(220),
    allowNull: false,
    unique: true,
  },

  // Código de barras (EAN-13 o similar)
  codigo_barras: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true,
  },

  // Marca del producto
  marca: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },

  // ── PRECIOS ──────────────────────────────────────────────
  // Precio base de lista (en pesos argentinos)
  // Las listas de precios por cliente se calculan sobre este valor
  precio_lista: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: { min: 0 }
  },

  // Precio de costo (para calcular márgenes en reportes)
  precio_costo: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    defaultValue: 0.00,
  },

  // ── STOCK ────────────────────────────────────────────────
  // Stock actual disponible
  stock_actual: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: { min: 0 }
  },

  // Cuando el stock baja de este número, se genera una alerta
  stock_minimo: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },

  // ── VENTA MAYORISTA ──────────────────────────────────────
  // Unidad en la que se vende: unidad, caja, paquete, rollo, kg, etc.
  unidad_venta: {
    type: DataTypes.STRING(30),
    defaultValue: 'unidad',
  },

  // Cantidad mínima por pedido (en unidades de venta)
  // Ej: si unidad_venta es "caja", cantidad_minima = 1 caja
  cantidad_minima: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: { min: 1 }
  },

  // Cuántas unidades físicas trae una unidad de venta
  // Ej: una "caja" trae 100 tornillos → contenido_por_unidad = 100
  contenido_por_unidad: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },

  // ── LOGÍSTICA ───────────────────────────────────────────
  peso_kg: {
    type: DataTypes.DECIMAL(8, 3),
    allowNull: true,
  },

  // Dimensiones en centímetros (para cálculo de flete)
  alto_cm: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
  },

  ancho_cm: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
  },

  largo_cm: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
  },

  // ── ESTADO ──────────────────────────────────────────────
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },

  // Destacado en la página principal del catálogo
  destacado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },

  imagen_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    defaultValue: null,
  },

  // Clave foránea a la categoría
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: Category, key: 'id' }
  },

}, {
  tableName: 'products',
  timestamps: true,
  underscored: true,
});

// Relaciones
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'categoria' });
Category.hasMany(Product, { foreignKey: 'category_id', as: 'productos' });

module.exports = Product;