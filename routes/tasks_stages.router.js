const express = require('express');
const { uploadfile } = require('../middleware/upload');

const Task_Stages_Router = require('../controllers/tasks_stages.controller');
const router = express.Router();

router.post('/v1/add', Task_Stages_Router.postAddTaskStage); // save data
router.post('/v1/getalldata', Task_Stages_Router.getAllTaskStage); //get all task stage data
router.get('/v1/getbyid/:id', Task_Stages_Router.getTaskStageById); //get by id
router.post('/v1/updatebyid', Task_Stages_Router.postUpdateTaskStage); //update task stage data
router.post('/v1/deletebyid', Task_Stages_Router.postDeleteTaskStageById); //delete by id
router.post('/v1/statuschange', Task_Stages_Router.poststatuschange); //delete by id
router.post(
  '/v1/getTaskStageByIdArray',
  Task_Stages_Router.getTaskStageByIdArray
); //get all by ID
router.post('/v1/uploadexcel', uploadfile, Task_Stages_Router.uploadexcel); //upload excel

router.post('/v1/validateExcel', uploadfile, Task_Stages_Router.validateUploadExcel);

router.post('/v1/reValidateTaskStages', Task_Stages_Router.reValidateTaskStages);

router.post('/v1/addValidateTaskStages', Task_Stages_Router.addValidateTaskStages);

router.post('/v1/send-reminder', Task_Stages_Router.sendReminder);
router.post('/v1/list-reminder', Task_Stages_Router.findAllReminder);



module.exports = router;
