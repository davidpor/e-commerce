const service = require('./companies.service');

const getEmpresas = async (req, res, next) => {
    try {
        const empresas = await service.getEmpresas(req.query);
        res.json({ empresas });
    } catch (e) { next(e); }
};

const getEmpresaPorId = async (req, res, next) => {
    try {
        const empresa = await service.getEmpresaPorId(req.params.id);
        res.json({ empresa });
    } catch (e) { next(e); }
};

const actualizarEmpresa = async (req, res, next) => {
    try {
        const empresa = await service.actualizarEmpresa(req.params.id, req.body);
        res.json({ empresa });
    } catch (e) { next(e); }
};

const toggleActiva = async (req, res, next) => {
    try {
        const empresa = await service.toggleActiva(req.params.id);
        res.json({ empresa, mensaje: `Empresa ${empresa.activa ? 'activada' : 'desactivada'}` });
    } catch (e) { next(e); }
};

module.exports = { getEmpresas, getEmpresaPorId, actualizarEmpresa, toggleActiva };