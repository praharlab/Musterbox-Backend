const express = require('express');
const formMasterController = require('../controllers/formmaster.controller');
const router = express.Router();

router.post('/v1/add', formMasterController.postAddForm); // save data
router.post('/v1/getalldata', formMasterController.getAllFormData); //get all form data
router.get('/v1/getbyid/:id', formMasterController.getFormById); //get by id
router.post('/v1/getbyparentid', formMasterController.postGetFormByParentId); //get by parent id
router.post('/v1/updatebyid', formMasterController.postUpdateForm); //update form data
router.post('/v1/deletebyid', formMasterController.postDeleteFormById); //delete by id
router.post('/v1/statuschanges', formMasterController.poststatuschange); //status change
router.post('/v1/search', formMasterController.postSearchForm); //search
router.get('/v1/getparentformdata', formMasterController.getparentformdata); //search
router.get('/v1/getforms', formMasterController.GetFormMaster); //search
router.get('/v1/getmenulist', formMasterController.getmenulist); //getmenulist

module.exports = router;
