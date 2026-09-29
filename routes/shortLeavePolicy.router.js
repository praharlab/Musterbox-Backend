const express = require('express');
const shortLeaveController = require('../controllers/shortLeave.controller');
const router = express.Router();

router.post('/v1/add', shortLeaveController.postAddShortLeave); // save data
router.post('/v1/update', shortLeaveController.updateShortLeave); // update data
router.get('/v1/getalldata', shortLeaveController.getAllShortLeaveData); //get all bank data
router.post('/v1/updateStatus', shortLeaveController.poststatuschange); //status change
router.delete('/v1/deleteShortLeave/:id', shortLeaveController.deleteShortLeave); //status change

module.exports = router;
