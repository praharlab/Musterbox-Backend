const express = require('express');
const viewController = require('../controllers/views.controller');
const router = express.Router();

router.post('/v1/create', viewController.createViews); // create Views

for (var v of viewController.views) {
  router.get('/v1/get' + v.title, viewController['get' + v.title]); // get users
}
module.exports = router;
