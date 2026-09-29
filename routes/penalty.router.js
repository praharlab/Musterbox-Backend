const express = require('express');
const penaltyController = require('../controllers/penalty.controller');
const router = express.Router();

router.post('/v1/add', penaltyController.postAddPenalty); // save data
router.post('/v1/getalldata', penaltyController.getAllPenaltyData); //get all penalty data
router.get('/v1/getbyid/:id', penaltyController.getPenaltyById); //get by id
router.post('/v1/updatebyid', penaltyController.postUpdatePenalty); //update penalty data
router.post('/v1/deletebyid', penaltyController.postDeletePenaltyById); //delete by id
router.post('/v1/statuschanges', penaltyController.poststatuschange); //status by id
router.post('/v1/getbycompanyid', penaltyController.getPenaltyByCompanyId); //get by company id
router.get(
  '/v1/getactivepenaltybycompanyid/:id',
  penaltyController.getactivepenaltybycompanyid
); //get by company id

module.exports = router;
