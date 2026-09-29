const express = require('express');
const investmentDetailsController = require('../controllers/investmentdetails.controller');
const router = express.Router();

router.post('/v1/add', investmentDetailsController.postSaveInvestmentDetails); //to save Investment details data
router.post(
  '/v1/getAll',
  investmentDetailsController.postReturnAllInvestmentDetails
); //to get all the data of investment details
router.post(
  '/v1/delete',
  investmentDetailsController.postDeleteInvestmentDetails
); //to delete investment by id
router.post(
  '/v1/update',
  investmentDetailsController.postUpdateInvestmentDetails
); //to update investment details
router.post(
  '/v1/getById',
  investmentDetailsController.postGetByUserMasterIdandYearmonth
); // to return investment details by user master id and yearmonth
router.get('/v1/getById/:id', investmentDetailsController.getReturnById);
router.post('/v1/statusChange', investmentDetailsController.poststatus);

module.exports = router;
