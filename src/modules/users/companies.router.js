const { Router } = require('express');
const ctrl = require('./companies.controller');
const { autenticar, autorizar } = require('../../middlewares/auth.middleware');

const router = Router();

router.get('/', autenticar, autorizar('admin', 'vendedor'), ctrl.getEmpresas);
router.get('/:id', autenticar, autorizar('admin', 'vendedor'), ctrl.getEmpresaPorId);
router.put('/:id', autenticar, autorizar('admin'), ctrl.actualizarEmpresa);
router.patch('/:id/toggle', autenticar, autorizar('admin'), ctrl.toggleActiva);

module.exports = router;