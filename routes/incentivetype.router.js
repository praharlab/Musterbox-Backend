const express = require('express');
const incentivetypecontroller = require('../controllers/incentivetype.controller');
const router = express.Router();

router.post('/v1/add', incentivetypecontroller.postAddincentivetype); // save data
router.post(
  '/v1/getalldatabycompanyid',
  incentivetypecontroller.getAllincentivedatabycompanyid
); //get all data
router.post('/v1/updatebyid', incentivetypecontroller.postUpdateincentivetype); //update data
router.post('/v1/statuschanges', incentivetypecontroller.poststatuschange); //status change active deavtive
router.get(
  '/v1/deletebyid/:id',
  incentivetypecontroller.deleteincentivetypeData
); //delete by id
router.get('/v1/getbyid/:id', incentivetypecontroller.getbyIncentivetypeId); //delete by id
router.post('/v1/destroy', incentivetypecontroller.postDeletebyIncentivetypeID); //update data

module.exports = router;
