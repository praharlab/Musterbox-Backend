const express = require('express');
const documentListController = require('../controllers/documentlist.controller');
const router = express.Router();

router.post('/v1/add', documentListController.postAddDocumentList); // save data
router.post('/v1/getalldata', documentListController.getAllDocumentListData); //get all document list data
router.get('/v1/getbyid/:id', documentListController.getDocumentListById); //get by id
router.post('/v1/updatebyid', documentListController.postUpdateDocumentList); //update document list data
router.post(
  '/v1/deletebyid',
  documentListController.postDeleteDocumentListById
); //delete by id
router.post('/v1/statuschanges', documentListController.poststatuschange); //status
router.post(
  '/v1/getActiveDocumentTypeData',
  documentListController.getActiveDocumentTypeData
); //status change

module.exports = router;
