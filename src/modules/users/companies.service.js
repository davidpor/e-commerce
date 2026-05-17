// src/modules/users/companies.service.js
const Company = require('./company.model');
const User = require('./user.model');
const { PriceList } = require('../pricing/pricing.model');
const { errors } = require('../../utils/errors');
const { Op } = require('sequelize');

const getEmpresas = async (query = {}) => {
    const where = {};
    if (query.buscar) {
        where[Op.or] = [
            { razon_social: { [Op.like]: `%${query.buscar}%` } },
            { cuit: { [Op.like]: `%${query.buscar}%` } },
        ];
    }
    if (query.activa !== undefined) {
        where.activa = query.activa === 'true';
    }

    return Company.findAll({
        where,
        include: [
            { model: User, as: 'usuarios', attributes: ['id', 'nombre', 'apellido', 'email', 'rol', 'activo'] },
            { model: PriceList, as: 'listaPrecio', attributes: ['id', 'nombre'], required: false },
        ],
        order: [['razon_social', 'ASC']],
    });
};

const getEmpresaPorId = async (id) => {
    const empresa = await Company.findByPk(id, {
        include: [
            { model: User, as: 'usuarios', attributes: ['id', 'nombre', 'apellido', 'email', 'rol', 'activo', 'ultimo_login'] },
            { model: PriceList, as: 'listaPrecio', attributes: ['id', 'nombre'], required: false },
        ],
    });
    if (!empresa) throw errors.notFound('Empresa');
    return empresa;
};

const actualizarEmpresa = async (id, data) => {
    const empresa = await Company.findByPk(id);
    if (!empresa) throw errors.notFound('Empresa');

    const campos = [
        'razon_social', 'condicion_iva', 'telefono', 'email_contacto',
        'direccion', 'ciudad', 'provincia', 'descuento_base',
        'limite_credito', 'price_list_id', 'activa',
    ];

    const actualizar = {};
    campos.forEach(c => {
        if (data[c] !== undefined) actualizar[c] = data[c];
    });

    await empresa.update(actualizar);
    return getEmpresaPorId(id);
};

const toggleActiva = async (id) => {
    const empresa = await Company.findByPk(id);
    if (!empresa) throw errors.notFound('Empresa');
    await empresa.update({ activa: !empresa.activa });
    return empresa;
};

module.exports = { getEmpresas, getEmpresaPorId, actualizarEmpresa, toggleActiva };