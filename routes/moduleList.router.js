const express = require('express');
const moduleListController = require('../controllers/moduleList.controller');
const router = express.Router();
const { uploadfile } = require('../middleware/upload');

router.post('/v1/add', moduleListController.postAddModule);
router.post('/v1/updatebyid', moduleListController.postUpdatemoduleList);
router.get('/v1/getbyid/:id', moduleListController.getmodulelistId);
router.post('/v1/deletebyid', moduleListController.postDeletemoduleById); //delete by id
router.post('/v1/getalldata', moduleListController.getAllModuleList);
router.post('/v1/statuschanges', moduleListController.poststatuschange); //status by id
router.post('/v1/uploadexcel', uploadfile, moduleListController.uploadexcel); //upload excel

module.exports = router;
