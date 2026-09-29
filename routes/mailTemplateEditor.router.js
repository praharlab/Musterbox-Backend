const express = require('express');
const mailtemplateEditorController = require('../controllers/mailTemplateEditor.controller');
const router = express.Router();

router.post('/v1/add', mailtemplateEditorController.postAddMailEditor); // save data
router.post('/v1/getalldata', mailtemplateEditorController.getAllMailEditor); //get all maileditor tax data
router.get(
  '/v1/getbyid/:id',
  mailtemplateEditorController.getMailTemplateEditorId
); //get by id
router.post('/v1/updatebyid', mailtemplateEditorController.postUpdatMailEditor); //update maileditor tax data
router.post(
  '/v1/deletebyid',
  mailtemplateEditorController.postDeleteMailEditorById
); //delete by id
router.post('/v1/statuschanges', mailtemplateEditorController.poststatuschange); //status by id

module.exports = router;
