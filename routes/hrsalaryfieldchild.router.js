const express = require('express');
const hrSalaryFieldChildController = require('../controllers/hrsalaryfieldchild.controller');
const router = express.Router();

router.post('/v1/add', hrSalaryFieldChildController.postAddHRSalaryFieldChild); // save data
router.post(
  '/v1/getalldata',
  hrSalaryFieldChildController.getAllHRSalaryFieldChildData
); //get all hr salary field id data
router.get(
  '/v1/getbyid/:id',
  hrSalaryFieldChildController.getHRSalaryFieldChildById
); //get by id
router.get(
  '/v1/getbysalaryfieldid/:id',
  hrSalaryFieldChildController.getHRSalaryFieldChildBySalaryFieldId
); //get by salary field id
router.post(
  '/v1/updatebyid',
  hrSalaryFieldChildController.postUpdateHRSalaryFieldChild
); //update hr salary field id data
router.post(
  '/v1/deletebyid',
  hrSalaryFieldChildController.postDeleteHRSalaryFieldChildById
); //delete by id
router.post('/v1/statuschanges', hrSalaryFieldChildController.poststatuschange); //status change
router.get(
  '/v1/salaryfieldbyeffected/:id',
  hrSalaryFieldChildController.salaryfieldbyeffected
); //status change
module.exports = router;
