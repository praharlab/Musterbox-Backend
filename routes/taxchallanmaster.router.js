const express = require('express');
const router = express.Router();
const taxchallanmasterController = require('../controllers/taxchallanmaster.controller');

router.post('/v1/add', taxchallanmasterController.postSaveTaxChallanMaster); //to save tax challan master
router.post(
  '/v1/getAll',
  taxchallanmasterController.postReturnAllTaxChallanMaster
);
router.post(
  '/v1/delete',
  taxchallanmasterController.postDeleteTaxChallanMaster
);
router.post(
  '/v1/update',
  taxchallanmasterController.postUpdateTaxChallanMaster
);
router.post(
  '/v1/getById',
  taxchallanmasterController.postReturnTaxChallanbyIdandTearMonth
);
router.get('/v1/getById/:id', taxchallanmasterController.getReturnById);
router.post(
  '/v1/poststatus',
  taxchallanmasterController.postchangestatusTaxChallanMaster
);

module.exports = router;
