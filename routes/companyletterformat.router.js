const express = require('express');
const router = express.Router();
const companyLetterFormatController = require('../controllers/companyLetterFormat.controller');

router.post(
  '/v1/add',
  companyLetterFormatController.postAddCompanyLetterFormat
);
router.post(
  '/v1/getAll',
  companyLetterFormatController.postGetAllCompanyLetterFormat
);
router.post(
  '/v1/update',
  companyLetterFormatController.postUpdateCompanyLetterFormat
);
router.get('/v1/getById/:id', companyLetterFormatController.getReturnById);
router.post(
  '/v1/delete',
  companyLetterFormatController.postDeleteCompanyLetterFormat
);

module.exports = router;
