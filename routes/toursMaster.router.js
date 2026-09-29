const express = require('express');
const toursMastercontroller = require('../controllers/toursMaster.controller');
const router = express.Router();

router.post('/v1/insert_data', toursMastercontroller.postAddtoursMaster);
router.post('/v1/view_data', toursMastercontroller.postViewtoursMaster);
router.post('/v1/update_data', toursMastercontroller.postUpdatetoursMaster);
router.get('/v1/getbyid_data/:id', toursMastercontroller.posttoursMasterById);
router.get(
  '/v1/delete_data/:id',
  toursMastercontroller.getDeletetoursMasterById
);
router.post('/v1/status_change', toursMastercontroller.postchangestatus);
router.post('/v1/getbyuserid', toursMastercontroller.gettouruserid);
router.post(
  '/v1/gettourdatabycompanyid',
  toursMastercontroller.gettourdatabycompanyid
);

module.exports = router;
