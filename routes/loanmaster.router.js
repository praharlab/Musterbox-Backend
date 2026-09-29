const express = require('express');
const router = express.Router();
const loanMasterController = require('../controllers/loanMaster.controller');

router.post('/v1/add', loanMasterController.postAddLoanMaster); // add loan master to database
router.post('/v1/advanceLoan/create', loanMasterController.postAddAdvanceLoan); // add loan Advance to database
router.get('/v1/getbyid/:id', loanMasterController.postGetLoanMasterbyLoanID); //return loan master by loan id
router.post('/v1/getLoanByCompanyId', loanMasterController.getLoanByCompanyid); //return loan master by CompanyID
router.get(
  '/v1/getbyusermasterid/:id',
  loanMasterController.postGetLoanMasterbyUserMasterID
); //return loan master by user master id
router.post('/v1/delete', loanMasterController.postDeleteByLoanID); // delete loan master by loan id
router.post('/v1/changestatus', loanMasterController.postStatusChange);
router.get('/v1/loanAdvance/:id', loanMasterController.getLoanAdvanceByLoanID);
router.post('/v1/update', loanMasterController.postUpdateLoanMaster); // to update loan master
router.get(
  '/v1/getloantransactionbyloanid/:id',
  loanMasterController.postReturnLoanTransactionbyLoanID
); // to get LoanTransaction by loan id
router.post('/v1/getLoanByUserId', loanMasterController.getLoanByUserId);
router.get('/v1/getid/:id', loanMasterController.getbyID); //get by loan id
router.get('/v1/getbyloanid/:id', loanMasterController.getbyloanID); //get by loanid

router.post('/v1/addrequest', loanMasterController.postloanmasteradd); //request api
router.post('/v1/changestatusrequest', loanMasterController.postStatusrequest);

router.post('/v1/loandatashow', loanMasterController.loandatashow);
module.exports = router;
