const express = require('express');
const visitController = require('../controllers/visit.controller');
const { permissionAccess } = require('../middleware/permissionAccess');
const router = express.Router();

router.post('/v1/add', visitController.postAddVisit); // save data
router.get('/v1/getbyid/:id', visitController.getVisitById); //get by id
router.post('/v1/updatebyid', visitController.postUpdateVisit); //update visit data
router.post('/v1/deletebyid', visitController.postDeleteVisitById); //delete by id
router.post('/v1/statuschanges', visitController.poststatuschange); //status change
router.post(
  '/v1/getbycompanyid',
  permissionAccess,
  visitController.getVisitByCompanyId
); //status change
router.get('/v1/getVisitByAssignID/:id', visitController.getVisitByAssignID); //get by id
router.post(
  '/v1/getVisitByUserID',
  permissionAccess,
  visitController.getVisitByUserID
); //get by id
router.post(
  '/v1/getVisitByCreateByID',
  permissionAccess,
  visitController.getVisitByCreateByID
); //get by id
router.post('/v1/VisitByCompanyId', visitController.VisitByCompanyId);
router.post('/v1/Team_Visit', visitController.TeamVisit);

module.exports = router;
