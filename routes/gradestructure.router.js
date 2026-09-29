const express = require('express');
const gradeStructureController = require('../controllers/gradestructure.controller');
const router = express.Router();

router.post('/v1/add', gradeStructureController.postAddGradeStructure); // save data
router.post(
  '/v1/getalldata',
  gradeStructureController.getAllGradeStructureData
); //get all grade structure data
router.get('/v1/getbyid/:id', gradeStructureController.getGradeStructureById); //get by id
router.post(
  '/v1/getbycompanyid',
  gradeStructureController.getGradeStructureByCompanyMasterId
); //get by company id
router.post(
  '/v1/updatebyid',
  gradeStructureController.postUpdateGradeStructure
); //update grade structure data
router.post(
  '/v1/deletebyid',
  gradeStructureController.postDeleteGradeStructureById
); //delete by id
router.post('/v1/statuschanges', gradeStructureController.poststatuschange); //status change
router.get(
  '/v1/getcompany/:id',
  gradeStructureController.getGradeStructureByCompanyId
); //status change
router.post(
  '/v1/getptvaluebycompanystate',
  gradeStructureController.getptvaluebycompanystate
); //status change
router.post('/v1/getctcvalue', gradeStructureController.getctcvalue); //status change
router.post('/v1/getctcvalue1', gradeStructureController.getctcvalue1);
router.post('/v1/getGradeForAssignStructure',gradeStructureController.getGradeForAssignStructure)

// router.post('/v1/toAddGradeFields', gradeStructureController.toAddGradeFields);

// router.post('/v1/addData',gradeStructureController.addData)

module.exports = router;
