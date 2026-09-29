const express = require('express');
const authorizationCriteriaMasterController = require('../controllers/authorizationCriteriaMaster.controller');
const router = express.Router();

router.post(
  '/v1/add',
  authorizationCriteriaMasterController.postAddAuthorizationCriteriaMaster
); // save data
router.post(
  '/v1/getalldata',
  authorizationCriteriaMasterController.getAuthorizationCriteriaMaster
); // save data

module.exports = router;
