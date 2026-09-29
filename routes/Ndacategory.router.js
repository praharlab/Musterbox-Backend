const express = require('express');
const Ndacategorycontroller = require('../controllers/Ndacategory.controller');
const router = express.Router();
const { uploadfile } = require('../middleware/upload');

router.post('/v1/add', Ndacategorycontroller.postAddcategory); //save the data
router.post('/v1/getalldata', Ndacategorycontroller.getAllcategoryData); //get the data
router.get('/v1/getbyid/:id', Ndacategorycontroller.getcategoryById); //get data by id
router.post('/v1/update', Ndacategorycontroller.postupdateeNdacategoryData); //update the data by id
router.get('/v1/delete/:id', Ndacategorycontroller.postdeletecategory); //delete data
router.post('/v1/getbycompanyid', Ndacategorycontroller.getuserCompanyId); //get by company id

router.post('/v1/bycompanyid', Ndacategorycontroller.getbyCompanyId); //get by company id
router.post('/v1/uploadexcel', uploadfile, Ndacategorycontroller.uploadexcel); //upload excel

router.post('/v1/validateExcel', uploadfile, Ndacategorycontroller.validateUploadExcel);

router.post('/v1/reValidateNdaCategory', Ndacategorycontroller.reValidateNdaCategory);

router.post('/v1/addValidateNdaCategory', Ndacategorycontroller.addValidateNdaCategory)

module.exports = router;
