const express = require('express');
const lettertemplatetypeController = require('../controllers/letterTemplateType.controller');
const router = express.Router();

router.post('/v1/add', lettertemplatetypeController.postAddLetterType); // save data
router.post('/v1/getalldata', lettertemplatetypeController.getAllLetterType); //get all lettertype tax data
router.get('/v1/getbyid/:id', lettertemplatetypeController.getLetterTypeId); //get by id
router.post('/v1/updatebyid', lettertemplatetypeController.postUpdatLetterType); //update Lettertype tax data
router.post(
  '/v1/deletebyid',
  lettertemplatetypeController.postDeleteLetterTypeById
); //delete by id
router.post('/v1/statuschanges', lettertemplatetypeController.poststatuschange); //status by id
router.post(
  '/v1/getActiveLetterTypeData',
  lettertemplatetypeController.getActiveLetterTypeData
); //get active data

module.exports = router;
