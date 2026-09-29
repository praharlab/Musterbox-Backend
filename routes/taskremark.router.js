const express = require('express');

const TaskRemarkController = require('../controllers/taskremark.controller');
const router = express.Router();

router.post('/v1/postAddTaskRemark', TaskRemarkController.postAddTaskRemark); // save data
router.get('/v1/getTaskById/:id', TaskRemarkController.getTaskById); //get by id

module.exports = router;
