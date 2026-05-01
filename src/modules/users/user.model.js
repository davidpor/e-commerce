// src/modules/users/user.model.js
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../../config/database');
const Company = require('./company.model');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    set(value) { this.setDataValue('nombre', value.trim()); }
  },

  apellido: {
    type: DataTypes.STRING(100),
    allowNull: false,
    set(value) { this.setDataValue('apellido', value.trim()); }
  },

  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
    set(value) { 
      // guardamos el email siempre en minúsculas
      this.setDataValue('email', value.toLowerCase().trim()); 
    }
  },

  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },

  // Rol del usuario dentro del sistema
  rol: {
    type: DataTypes.ENUM('admin', 'vendedor', 'cliente'),
    defaultValue: 'cliente',
  },

  telefono: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },

  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },

  // Guardamos el último login para auditoría
  ultimo_login: {
    type: DataTypes.DATE,
    allowNull: true,
  },

  // Clave foránea: a qué empresa pertenece este usuario
  // Los admins y vendedores pueden tener company_id null
  company_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Company,
      key: 'id',
    }
  },

}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,

  // Los hooks son funciones que se ejecutan automáticamente
  // antes o después de ciertas operaciones
  hooks: {
    // Antes de crear un usuario, encriptamos la contraseña
    beforeCreate: async (user) => {
      if (user.password_hash) {
        // El número 12 es el "costo" del hash.
        // Más alto = más seguro pero más lento.
        // 12 es el valor recomendado para producción.
        const salt = await bcrypt.genSalt(12);
        user.password_hash = await bcrypt.hash(user.password_hash, salt);
      }
    },
    // También encriptamos si actualizan la contraseña
    beforeUpdate: async (user) => {
      if (user.changed('password_hash')) {
        const salt = await bcrypt.genSalt(12);
        user.password_hash = await bcrypt.hash(user.password_hash, salt);
      }
    },
  },
});

// Método de instancia: compara contraseña ingresada con el hash guardado
// Se usa en el login: user.validarPassword('123456')
User.prototype.validarPassword = async function(password) {
  return bcrypt.compare(password, this.password_hash);
};

// Método de instancia: devuelve el usuario sin la contraseña
// Se usa antes de enviar datos al frontend
User.prototype.toPublic = function() {
  const { password_hash, ...userData } = this.toJSON();
  return userData;
};

// Relaciones entre modelos
// Un usuario pertenece a una empresa
User.belongsTo(Company, { foreignKey: 'company_id', as: 'empresa' });
// Una empresa tiene muchos usuarios
Company.hasMany(User, { foreignKey: 'company_id', as: 'usuarios' });

module.exports = User;