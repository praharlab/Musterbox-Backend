const express = require('express');
const employeePenaltyController = require('../controllers/employeepenalty.controller');
const router = express.Router();
const { configureMulter, handleMulterErrors } = require('../middleware/multer');
const path = require('path');

const multerMiddleware = configureMulter(
  path.join(__dirname, '../uploads/employee-penalty-attachments'),
  1024 * 1024 * 10,
  ['image/jpeg', 'image/png']
);

router.post(
  '/v1/add',
  multerMiddleware.single('attachment'),
  employeePenaltyController.postAddEmployeePenalty
); // save data
router.post(
  '/v1/getalldata',
  employeePenaltyController.getAllEmployeePenaltyData
); //get all emplyee penalty data
router.get('/v1/getbyid/:id', employeePenaltyController.getEmployeePenaltyById); //get by id
router.get(
  '/v1/getbyuserid/:id',
  employeePenaltyController.getEmployeePenaltyByUserId
); //get by user id
router.post(
  '/v1/updatebyid',
  multerMiddleware.single('attachment'),
  employeePenaltyController.postUpdateEmployeePenalty
); //update emplyee penalty data
router.post(
  '/v1/deletebyid',
  employeePenaltyController.postDeleteEmployeePenaltyById
); //delete by id
router.post('/v1/statuschanges', employeePenaltyController.poststatuschange); //status change
router.post('/v1/getbyuserid', employeePenaltyController.getPenaltyByUserID); // get by user id
module.exports = router;
