const express = require('express');
const reportToController = require('../controllers/reportTo.controller');
const { permissionAccess } = require('../middleware/permissionAccess');
const router = express.Router();

router.get('/v1/display/:id', reportToController.display_report_to);
router.get('/v1/reportsto/:id', reportToController.reportsto);
router.get(
  '/v1/reportstowithoutchild/:id',
  permissionAccess,
  reportToController.reportstowithoutchild
);
router.get(
  '/v1/reportstowithoutchildvisit/:id',
  permissionAccess,
  reportToController.reportstowithoutchildvisit
);
router.get(
  '/v1/reportstoattendancelog/:id',
  permissionAccess,
  reportToController.reportstoattendancelog
);
router.get(
  '/v1/reportstostructure/:id',
  permissionAccess,
  reportToController.reportstoforstructure
);
router.post(
  '/v1/reportstowithoutchilddatewise',
  permissionAccess,
  reportToController.reportstowithoutchilddatewise
);

router.get(
  '/v1/reportstoImmediateChild',

  reportToController.reportstoImmediateChild
);

router.get(
  '/v1/reportstoImmediateParent',
  reportToController.reportstoImmediateParent
);

module.exports = router;
