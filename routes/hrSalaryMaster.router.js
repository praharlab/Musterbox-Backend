const express = require('express');
const hrSalaryMaster = require('../controllers/hrSalaryMaster.controller.js');
const router = express.Router();

router.post('/v1/add', hrSalaryMaster.postAddHRSalaryMaster); // save data
router.post('/v1/getalldata', hrSalaryMaster.getAllHRSalaryMaster); //get all hr salary fields data
router.get('/v1/getbyid/:id', hrSalaryMaster.getSalayMasterByUser); //get by id
router.post('/v1/updatebyid', hrSalaryMaster.postUpdateHRSalaryMaster); //update hr salary fields data
router.post('/v1/removeStructrureByid', hrSalaryMaster.removeStructrureByid); //remove hrsalarymaster
router.post('/v1/deleteSalaryMaster', hrSalaryMaster.deleteSalaryMaster); //remove hrsalarymaster
router.get('/v1/', hrSalaryMaster.getAllSalaryStructureByUserId);
router.post('/v1/getSalaryStructure', hrSalaryMaster.getOldNewSalaryStructure);
module.exports = router;
