const express = require('express');
const router = express.Router();
const form16Controller = require('../controllers/form16.controller');

router.post('/v1/add', form16Controller.postSaveForm16); //save form 16 and child
router.post('/v1/getAll', form16Controller.postReturnAllForm16andChild); //get all data of form 16
router.post('/v1/delete', form16Controller.postDeleteForm16); //delete form 16 and its child
router.post('/v1/update', form16Controller.postUpdateform16andchild); //update data of form 16 and its child
router.post('/v1/getAllParent', form16Controller.postReturnAllForm16);
router.post(
  '/v1/getAllChildData',
  form16Controller.postReturnAllForm16ChildData
);
router.post('/v1/statuschange', form16Controller.postStatusChange);
router.get('/v1/getbyid/:id', form16Controller.getForm16byForm16ID);

module.exports = router;
