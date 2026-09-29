const express = require('express');
const companyLetterheadController = require('../controllers/companyletterhead.controller');
const { uploadletterhead } = require('../middleware/upload');
const router = express.Router();

router.post(
  '/v1/add',
  uploadletterhead,
  companyLetterheadController.postAddCompanyLetterhead
); // save data
router.get(
  '/v1/getbycompanyid/:id',
  companyLetterheadController.getCompanyLetterheadByCompanyMasterId
); //get by company id
module.exports = router;
