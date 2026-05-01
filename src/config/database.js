// src/config/database.js

// Importamos Sequelize (el ORM que usamos para hablar con MariaDB)
const { Sequelize } = require('sequelize');

// Cargamos las variables del archivo .env
require('dotenv').config();

// Creamos la instancia de conexión
const sequelize = new Sequelize(
  process.env.DB_NAME,   // nombre de la base de datos
  process.env.DB_USER,   // usuario
  process.env.DB_PASS,   // contraseña
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',    // MariaDB es compatible con el dialecto mysql

    // En desarrollo mostramos las queries SQL en consola para debuggear.
    // En producción lo apagamos para no llenar los logs.
    logging: process.env.NODE_ENV === 'development' 
      ? (sql) => console.log(`\x1b[36m[SQL]\x1b[0m ${sql}`) 
      : false,

    // Pool de conexiones: en vez de abrir y cerrar una conexión por cada
    // query, mantenemos un grupo de conexiones reutilizables.
    pool: {
      max: 10,       // máximo 10 conexiones simultáneas
      min: 0,        // mínimo 0 (se cierran si no se usan)
      acquire: 30000, // espera máx 30 seg para obtener una conexión
      idle: 10000    // cierra conexiones inactivas después de 10 seg
    }
  }
);

module.exports = sequelize;