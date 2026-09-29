const express = require('express');
const functionController = require('../controllers/functions.controller');
const router = express.Router();

router.get('/v1/create', functionController.createFunctions); // create functions

for (var f of functionController.functions) {
  router.post('/v1/' + f.title, functionController[f.title]); // get users
}
module.exports = router;
