const express = require('express');
const userAddressController = require('../controllers/useraddress.controller');
const router = express.Router();

router.post('/v1/add', userAddressController.postAddUserAddress); // save data
router.get('/v1/getbyid/:id', userAddressController.getUserAddressById); //get by id
router.get(
  '/v1/getbyuserid/:id',
  userAddressController.getUserAddressByUserMasterId
); //get by user id
router.post('/v1/updatebyid', userAddressController.postUpdateUserAddress); //update user address data
router.post('/v1/deletebyid', userAddressController.postDeleteUserAddressById); //delete by id
router.post('/v1/statuschanges', userAddressController.poststatuschange); //status change

router.post('/v1/verifyreq', userAddressController.postAddVerifyRequest);

module.exports = router;
