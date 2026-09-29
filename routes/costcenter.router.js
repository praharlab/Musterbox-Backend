const express = require('express');
const costCenterController = require('../controllers/costcenter.controller');
const router = express.Router();

router.post('/v1/add', costCenterController.postAddCostCenter); // save data
router.post('/v1/getalldata', costCenterController.getAllCostCenterData); //get all cost center data
router.get('/v1/getbyid/:id', costCenterController.getCostCenterById); //get by id
router.post('/v1/updatebyid', costCenterController.postUpdateCostCenter); //update cost center data
router.post('/v1/deletebyid', costCenterController.postDeleteCostCenterById); //delete by id
router.post('/v1/statuschanges', costCenterController.poststatuschange); //status change
module.exports = router;
