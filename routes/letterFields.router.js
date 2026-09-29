const express = require('express');
const letterFieldsController = require('../controllers/letterFields.controller');
const router = express.Router();

router.post('/v1/add', letterFieldsController.postAddLetterFields); // save data
router.post('/v1/getalldata', letterFieldsController.getAllLetterFields); //get all letterfields tax data
router.get('/v1/getbyid/:id', letterFieldsController.getLetterFieldsId); //get by id
router.post(
  '/v1/deletebyid',
  letterFieldsController.postDeleteLetterFieldsById
); //delete by id
router.post('/v1/statuschanges', letterFieldsController.poststatuschange); //status by id
router.post(
  '/v1/getLetterFieldsByLetterType',
  letterFieldsController.getLetterFieldsByLetterType
); //get mailfields by mailtype id
router.post(
  '/v1/getActiveLetterTypeData',
  letterFieldsController.getActiveLetterTypeData
);

module.exports = router;
