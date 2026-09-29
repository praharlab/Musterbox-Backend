const express = require('express');
const FNFProcessController = require('../controllers/fnfProcess.controller');
const router = express.Router();

router.post('/v1/getFNFCount', FNFProcessController.getFNFCount);
router.post('/v1/listFNF', FNFProcessController.listFNF); // list FNF Employees
router.get('/v1/resignationByUserId/:id', FNFProcessController.resignationByUserId); // Approved Resignation Details
router.get('/v1/assetByUserId/:id', FNFProcessController.assetByUserId) // Pending Asset By userId
router.get('/v1/advanceByUserId/:id', FNFProcessController.advanceByUserId) // Pending Advance By userId
router.get('/v1/loanByUserId', FNFProcessController.loanByUserId) // Pending Loan By userId
router.get('/v1/penaltyByUserId', FNFProcessController.penaltyByUserId) // Pending current month Penalty By userId

router.post('/v1/addEmp_repayment',FNFProcessController.addEmp_repayment) // add advance and Penalty Repayment

router.post('/v1/loanTransInFNF',FNFProcessController.loanTransInFNF) // set  same month for all loantransactions 





module.exports = router;