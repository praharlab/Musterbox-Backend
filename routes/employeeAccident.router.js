const express = require('express');
const employeeAccidentController = require('../controllers/employeeAccident.controller');
const router = express.Router();

router.post('/v1/add', employeeAccidentController.AddEmpAccident);
router.post(
  '/v1/getEmpAccidentData',
  employeeAccidentController.getEmpAccidentData
);
router.get(
  '/v1/getEmpAccidentDataById/:id',
  employeeAccidentController.getEmpAccidentDataById
);
router.post('/v1/updatebyid', employeeAccidentController.postUpdateEmpAccident);
router.post('/v1/delete', employeeAccidentController.postDeleteEmpAccident);

module.exports = router;
