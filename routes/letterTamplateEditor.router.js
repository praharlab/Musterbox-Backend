const express = require('express');
const lettertemplateEditorController = require('../controllers/letterTemplateEditor.controller');
const { uploaddocfile } = require('../middleware/upload');

const router = express.Router();

// router.post('/v1/add', lettertemplateEditorController.postAddLetterEditor); // save data
router.post(
  '/v1/add',
  uploaddocfile,
  lettertemplateEditorController.postAddLetterEditor
); // save data
router.post(
  '/v1/getalldata',
  lettertemplateEditorController.getAllLetterEditor
); // get all lettereditor tax data
router.get(
  '/v1/getbyid/:id',
  lettertemplateEditorController.getLetterTemplateEditorId
); // get by id
router.post(
  '/v1/updatebyid',
  uploaddocfile,
  lettertemplateEditorController.postUpdatLetterEditor
); // update lettereditor tax data
router.post(
  '/v1/deletebyid',
  lettertemplateEditorController.postDeleteLetterEditorById
); // delete by id
router.post(
  '/v1/statuschanges',
  lettertemplateEditorController.poststatuschange
); // status by id

module.exports = router;
