// src/modules/catalog/category.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Category = sequelize.define('Category', {
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

  // Slug: versión del nombre para usar en URLs
  // Ej: "Herramientas Eléctricas" → "herramientas-electricas"
  slug: {
    type: DataTypes.STRING(120),
    allowNull: false,
    unique: true,
  },

  // Categoría padre (para subcategorías)
  // Ej: Categoría "Cables" puede ser hija de "Electricidad"
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
  },

  activa: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },

  // Orden de aparición en el catálogo
  orden: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },

}, {
  tableName: 'categories',
  timestamps: true,
  underscored: true,
});

module.exports = Category;