const express = require('express');
const router = express.Router();
const companyServiceStatusController = require('../controllers/companyServiceStatus.controller');

router.post('/v1/add', companyServiceStatusController.postadd);

router.post('/v1/listdata', companyServiceStatusController.listdata);

router.put('/v1/editdata/:id', companyServiceStatusController.editdata);

router.delete('/v1/deletedata/:id', companyServiceStatusController.deletebyid);

router.get('/v1/getdata/:id', companyServiceStatusController.getById);

router.post(
  '/v1/statuschange',
  companyServiceStatusController.poststatuschange
);

module.exports = router;
