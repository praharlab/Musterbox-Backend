const express = require('express');
const companytypeController = require('../controllers/companytype.controller');
const router = express.Router();

router.post('/v1/add', companytypeController.postAddCompanyType); // save data
router.post('/v1/getalldata', companytypeController.getAllCompanyType); //get all companytype
router.post(
  '/v1/getActiveCompanyType',
  companytypeController.getActiveCompanyType
); //get all Active companytype
router.get('/v1/getbyid/:id', companytypeController.getCompanyTypeId); //get by id
router.post('/v1/updatebyid', companytypeController.postUpdateCompanyType); //update companytype
router.post('/v1/deletebyid', companytypeController.postDeleteCompanyTypeById); //delete by id
router.post('/v1/statuschanges', companytypeController.poststatuschange); //status by id
module.exports = router;
