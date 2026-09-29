const express = require('express');
const joiningDocumentMasterController = require('../controllers/joiningDocumentType.controller');
const router = express.Router();

router.post(
  '/v1/addJoinoingDocumentType',
  joiningDocumentMasterController.addJoinoingDocument
); // save data
router.post(
  '/v1/gettAlljoiningDocumentTypeData',
  joiningDocumentMasterController.gettAllJoiningDocumentData
); //get all document list data
router.get(
  '/v1/getjoiningDocumentTypeById',
  joiningDocumentMasterController.getJoiningDocumentById
); //get by id
router.post(
  '/v1/updatejoiningDocumentType',
  joiningDocumentMasterController.updateJoiningDocument
); //update document list data
router.post(
  '/v1/statusChangesjoiningDocumentType',
  joiningDocumentMasterController.statusChangesJoiningDocument
); //status

router.post(
  '/v1/deletejoiningDocumentType',
  joiningDocumentMasterController.deleteJoiningDocument
); //delete by id

module.exports = router;
