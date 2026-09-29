const express = require('express');
const router = express.Router();
const companyTrainingController = require('../controllers/companyTraining.controller');

router.post('/v1/add', companyTrainingController.postadd);

router.post('/v1/listdata', companyTrainingController.listdata);

router.get('/v1/getbyid/:id', companyTrainingController.getById);

router.put('/v1/editby/:id', companyTrainingController.updatedata);

router.delete('/v1/deleteby/:id', companyTrainingController.deletedatabyId);

// router.post(
//   '/v1/statuschange',
//   companyServiceStatusController.poststatuschange
// );

module.exports = router;
