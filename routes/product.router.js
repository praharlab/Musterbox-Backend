const express = require('express');
const productController = require('../controllers/product.controller');
const { uploadProductPhoto } = require('../middleware/upload');
const router = express.Router();
const { uploadfile } = require('../middleware/upload');

router.post('/v1/add', uploadProductPhoto, productController.postAddProduct); // save data
router.post('/v1/getalldata', productController.getAllProductData); //get all product data
router.get('/v1/getbyid/:id', productController.getProductById); //get by id
router.post('/v1/getbycompanyid', productController.getProductByCompanyId); //get by company id
router.post(
  '/v1/updatebyid',
  uploadProductPhoto,
  productController.postUpdateProduct
); //update product data
router.post('/v1/deletebyid', productController.postDeleteProductById); //delete by id
router.post('/v1/statuschanges', productController.poststatuschange); //status change
router.get(
  '/v1/getallbyparent/:id',
  productController.getAllProductByChild_Parent
);

router.post('/v1/uploadexcel', uploadfile, productController.uploadProduct); //upload

router.post(
  '/v1/validateExcel',
  uploadfile,
  productController.validateUploadExcel
);

router.post('/v1/reValidateProduct', productController.reValidateProduct);

router.post('/v1/addValidateProduct', productController.addValidateProduct);

module.exports = router;
