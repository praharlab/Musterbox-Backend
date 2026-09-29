const express = require('express');
const employeeBonusPolicyController = require('../controllers/employeeBonusPolicy.controller');
const router = express.Router();


router.post('/v1/add', employeeBonusPolicyController.addData); // save data
router.get('/v1/getByUserId/:id', employeeBonusPolicyController.getByUserId); 
router.post('/v1/delete', employeeBonusPolicyController.delete); 
router.post('/v1/getAllEmployeeBonusPolicy', employeeBonusPolicyController.getAllEmployeeBonusPolicy); 


module.exports = router;