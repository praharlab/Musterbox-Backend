const express = require('express');
const router = express.Router();
const quartertaxchallanController = require('../controllers/quartertaxchallan.controller');

router.post('/v1/add', quartertaxchallanController.postSaveQuarterTaxChallan);
router.post(
  '/v1/getAll',
  quartertaxchallanController.postReturnAllQuarterTaxChallan
);
router.post(
  '/v1/delete',
  quartertaxchallanController.postDeleteQuarterTaxChallan
);
router.post(
  '/v1/update',
  quartertaxchallanController.postUpdateQuarterTaxChallan
);
router.post(
  '/v1/getById',
  quartertaxchallanController.postReturnbyUserMasterIdandyearMonth
);
router.get('/v1/getById/:id', quartertaxchallanController.getReturnById);
router.post('/v1/poststatus', quartertaxchallanController.poststatus);

module.exports = router;
