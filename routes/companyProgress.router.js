const express = require('express');
const router = express.Router();
const companyProgressController = require('../controllers/companyProgress.controller');

router.post('/v1/add', companyProgressController.postadd);

router.post(
  '/v1/getdatabyCompanyId',
  companyProgressController.getdatabyCompanyId
);

router.post(
  '/v1/getdatabyCompanyStatusId',
  companyProgressController.getdatabyCompanyStatusId
);

router.put('/v1/updatedata/:id', companyProgressController.updatedata);

router.delete('/v1/deletedata/:id', companyProgressController.deletedatabyId);

router.get('/v1/getById/:id', companyProgressController.getById);

router.post(
  '/v1/getdatabyUserMasterId',
  companyProgressController.getdatabyUserMasterId
);

router.post('/v1/getdatabyIds', companyProgressController.getdatabyIds);

router.get('/v1/gethistroydata/', companyProgressController.gethistroydata);

module.exports = router;
