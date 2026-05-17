// src/modules/users/company.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  razon_social: {
    type: DataTypes.STRING(200),
    allowNull: false,
    // trim elimina espacios al inicio y final automáticamente
    set(value) { this.setDataValue('razon_social', value.trim()); }
  },

  cuit: {
    type: DataTypes.STRING(13),
    allowNull: false,
    unique: true,  // no puede haber dos empresas con el mismo CUIT
    // Formato esperado: 20-12345678-9
    validate: {
      is: /^\d{2}-\d{8}-\d{1}$/,
    }
  },

  // Condición ante AFIP
  condicion_iva: {
    type: DataTypes.ENUM(
      'responsable_inscripto',
      'monotributista',
      'exento',
      'consumidor_final'
    ),
    defaultValue: 'responsable_inscripto',
  },

  // Lista de precios asignada a esta empresa
  // (null = usa lista general, se asigna después desde el backoffice)
  price_list_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
  },

  // Porcentaje de descuento base negociado con este cliente
  // Ej: 5 = 5% de descuento en todos los productos
  descuento_base: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    validate: { min: 0, max: 100 }
  },

  // Límite de crédito en pesos (0 = no tiene crédito, paga al contado)
  limite_credito: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },

  telefono: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },

  email_contacto: {
    type: DataTypes.STRING(150),
    allowNull: true,
    validate: { isEmail: true }
  },

  direccion: {
    type: DataTypes.STRING(300),
    allowNull: true,
  },

  ciudad: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },

  provincia: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },

  // Cuenta activa o suspendida por el administrador
  activa: {
    type: DataTypes.BOOLEAN,
    defaultValue: false, // empieza inactiva hasta que el admin la aprueba
  },

}, {
  tableName: 'companies',
  timestamps: true,            // agrega created_at y updated_at automáticamente
  underscored: true,           // usa snake_case en la BD (price_list_id, no priceListId)
});

const { PriceList } = require('../pricing/pricing.model');

Company.belongsTo(PriceList, { foreignKey: 'price_list_id', as: 'listaPrecio' });

module.exports = Company;