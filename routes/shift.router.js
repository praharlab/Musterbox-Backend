const express = require('express');
const shiftController = require('../controllers/shift.controller');
const router = express.Router();

router.post('/v1/add', shiftController.postAddShift); // save data
router.post('/v1/getalldata', shiftController.getAllShiftData); //get all bank data
router.get('/v1/getbyid/:id', shiftController.getShiftById); //get by id
router.post('/v1/getbycompanyid', shiftController.getShiftByCompanyId); //get by company id
router.post('/v1/updatebyid', shiftController.postUpdateShift); //update bank data
router.post('/v1/deletebyid', shiftController.postDeleteShiftById); //delete by id
router.post('/v1/statuschanges', shiftController.poststatuschange); //status change
router.get(
  '/v1/getactiveshiftbycompanyid/:id',
  shiftController.getactiveshiftbycompanyid
);
router.post('/v1/getPaneltyData', shiftController.getPaneltyManagement); //get Panelty
router.post('/v1/removePaneltyData', shiftController.deletePenalty); //Remove Panelty
module.exports = router;
