const express = require('express');
const tdsslabmasterController = require('../controllers/tdsslabmaster.controller');
const router = express.Router();

router.post('/v1/add', tdsslabmasterController.postSaveTdsSlabMaster);
router.post('/v1/getAll', tdsslabmasterController.postReturnAllTdsSlabMaster);
router.post('/v1/delete', tdsslabmasterController.postDeleteTdsSlabMaster);
router.post('/v1/update', tdsslabmasterController.postUpdateTdsSlabMaster);
router.post(
  '/v1/getById',
  tdsslabmasterController.postReturnTDSslabmasterbyIdandYearMonth
);
router.get('/v1/getById/:id', tdsslabmasterController.getReturnById);
router.post(
  '/v1/poststatus',
  tdsslabmasterController.postchangestatusTdsSlabMaster
);

module.exports = router;
