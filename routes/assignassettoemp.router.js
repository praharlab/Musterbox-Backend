const express = require('express');
const employeeAssetController = require('../controllers/assignassettoemp.controller');
const { uploademployeeassets, uploadfile } = require('../middleware/upload');
const router = express.Router();

router.post(
  '/v1/add',
  uploademployeeassets,
  employeeAssetController.postAddEmployeeAsset
); // save data
router.post('/v1/getalldata', employeeAssetController.getAllEmployeeAssetData); //get all employee asset data
router.get('/v1/getbyid/:id', employeeAssetController.getEmployeeAssetById); //get by id
router.get(
  '/v1/getbyuserid/:id',
  employeeAssetController.getEmployeeAssetByUserId
); //get by user id
router.post(
  '/v1/updatebyid',
  uploademployeeassets,
  employeeAssetController.postUpdateEmployeeAsset
); //update employee asset data
router.post(
  '/v1/deletebyid',
  employeeAssetController.postDeleteEmployeeAssetById
); //delete by id
router.post('/v1/statuschanges', employeeAssetController.poststatuschange); //status change
router.post('/v1/return', employeeAssetController.returnAsset); //status change
router.post(
  '/v1/GetbyAssetCategoryID',
  employeeAssetController.GetbyAssetCategoryID
); //Get by Asset Category ID
router.get('/v1/getdata/:id', employeeAssetController.Getalldata);
router.post(
  '/v1/getbyUserID',
  employeeAssetController.getEmployeeAssetDatabyUserID
); //Get by Asset Category ID

router.post('/v1/uploadExcel', uploadfile, employeeAssetController.uploadExcel);
router.post('/v1/generateDemoExcel', employeeAssetController.generateDemoExcel);

module.exports = router;
