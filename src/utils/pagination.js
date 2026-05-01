// src/utils/pagination.js

// Recibe los query params del request y devuelve
// los valores que Sequelize necesita para paginar
const getPagination = (query) => {
  // El cliente puede pedir la página que quiere.
  // Si no manda nada, arrancamos en la página 1.
  const page  = Math.max(1, parseInt(query.page)  || 1);
  
  // Cuántos resultados por página. Máximo 100 para no sobrecargar.
  const limit = Math.min(100, parseInt(query.limit) || 20);
  
  // offset = cuántos registros saltear
  // Página 1 → offset 0 (empieza desde el primero)
  // Página 2 → offset 20 (saltea los primeros 20)
  // Página 3 → offset 40, etc.
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

// Arma el objeto de respuesta con metadata de paginación
// para que el frontend sepa cuántas páginas hay en total
const getPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    total,          // total de registros en la BD
    totalPages,     // total de páginas
    currentPage: page,
    perPage: limit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

module.exports = { getPagination, getPaginationMeta };