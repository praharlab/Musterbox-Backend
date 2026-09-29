const express = require('express');
const gradeSalaryStructureController = require('../controllers/gradesalarystructure.controller');
const router = express.Router();

router.post(
  '/v1/add',
  gradeSalaryStructureController.postAddGradeSalaryStructure
); // save data
router.post(
  '/v1/getalldata',
  gradeSalaryStructureController.getAllGradeSalaryStructureData
); //get all grade salary structure data
router.get(
  '/v1/getbyid/:id',
  gradeSalaryStructureController.getGradeSalaryStructureById
); //get by id
router.post(
  '/v1/updatebyid',
  gradeSalaryStructureController.postUpdateGradeSalaryStructure
); //update grade salary structure data
router.post(
  '/v1/deletebyid',
  gradeSalaryStructureController.postDeleteGradeSalaryStructureById
); //delete by id
router.post(
  '/v1/statuschanges',
  gradeSalaryStructureController.poststatuschange
); //status change
router.post(
  '/v1/getsalarystructuredataBygradeId',
  gradeSalaryStructureController.getsalarystructuredataBygradeId
);
module.exports = router;
