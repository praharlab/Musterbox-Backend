const express = require('express');
const resignTaskAssign = require('../controllers/resignTaskAssign.controller');
const router = express.Router();

router.post(
  '/v1/getAllresigntaskAssign',
  resignTaskAssign.getAllresignTaskAssign
);
router.post(
  '/v1/postUpdateresignTaskAssign',
  resignTaskAssign.postUpdateresignTaskAssign
);

module.exports = router;
