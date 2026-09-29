const express = require('express');
const commonController = require('../controllers/common.controller');
const router = express.Router();

router.post('/v1/getview', commonController.getView); // get view data
router.post('/v1/query', commonController.getQueryResult); // get query resuslts
module.exports = router;
