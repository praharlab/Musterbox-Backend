const express = require('express');
const DailyTask = require('../controllers/dailyTask.controller');
const { uploaddailyTask } = require('../middleware/upload');
const router = express.Router();

router.post('/v1/add', uploaddailyTask, DailyTask.postAdddailyTask);
router.post('/v1/getAll', DailyTask.getAllTask);
router.post('/v1/deletebyID', DailyTask.postDelete);
router.post('/v1/update', uploaddailyTask, DailyTask.TaskupdateData);
router.get('/v1/getbyID/:id', DailyTask.getById);
router.post('/v1/getAllbyCompany', DailyTask.getAllTaskbyCompany);

router.post('/v2/add', uploaddailyTask, DailyTask.postAdddailyTaskNew); // with multiple image
router.post('/v2/getAll', DailyTask.getAllTaskNew);
router.post('/v2/update', uploaddailyTask, DailyTask.updateNew);

module.exports = router;
