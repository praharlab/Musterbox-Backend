const express = require('express');
const router = express.Router();
const uniformDetailController = require('../controllers/uniformDetail.controller');
const UniformDetail = require('../models/uniformDetail');

router.post('/v1/addUniformData', uniformDetailController.addUniformData);

router.get('/v1/listUniformData', uniformDetailController.listUniformData);

router.put('/v1/editUniformData', uniformDetailController.editUniformData);

router.get(
  '/v1/getUniformDataByID/:id',
  uniformDetailController.getUniformDataByID
);

router.get(
  '/v1/getUniformDataByUserMasterID/:id',
  uniformDetailController.getUniformDataByUserMasterID
);

router.delete(
  '/v1/deleteUniformData/:uniformDetailID',
  uniformDetailController.deleteUniformData
);

module.exports = router;
