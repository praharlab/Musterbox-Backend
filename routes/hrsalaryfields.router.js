const express = require('express');
const hrSalaryFieldsController = require('../controllers/hrsalaryfields.controller');
const router = express.Router();

router.post('/v1/add', hrSalaryFieldsController.postAddHRSalaryFields); // save data
router.post(
  '/v1/getalldata',
  hrSalaryFieldsController.getAllHRSalaryFieldsData
); //get all hr salary fields data
router.get('/v1/getbyid/:id', hrSalaryFieldsController.getHRSalaryFieldsById); //get by id
router.post(
  '/v1/updatebyid',
  hrSalaryFieldsController.postUpdateHRSalaryFields
); //update hr salary fields data
router.post(
  '/v1/deletebyid',
  hrSalaryFieldsController.postDeleteHRSalaryFieldsById
); //delete by id
router.post('/v1/statuschanges', hrSalaryFieldsController.poststatuschange); //status change
router.get(
  '/v1/getbyidactive/:id',
  hrSalaryFieldsController.getActiveHRSalaryFieldsById
); //get by id
router.post('/v1/getbycompanyid', hrSalaryFieldsController.getallbycompany); //get by id
router.post(
  '/v1/getbycompanyidfordropdown',
  hrSalaryFieldsController.getbycompanyidforgradedropdown
);
router.post(
  '/v1/getcompanypayhead',
  hrSalaryFieldsController.getpayheadbycompany
);
router.post('/v1/getindex', hrSalaryFieldsController.postcheckindex);
module.exports = router;
