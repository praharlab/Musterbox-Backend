const express = require('express');
const productMasterController = require('../controllers/productmaster.controller');
const router = express.Router();

router.post('/v1/add', productMasterController.postAddProduct); // save data
router.post('/v1/getalldata', productMasterController.getAllProductData); //get all product data
router.get('/v1/getbyid/:id', productMasterController.getProductById); //get by id
router.post('/v1/updatebyid', productMasterController.postUpdateProduct); //update product data
router.post('/v1/deletebyid', productMasterController.postDeleteProductById); //delete by id
router.post('/v1/statuschanges', productMasterController.poststatuschange); //status change
module.exports = router;
