const express = require('express');
const { uploadtask } = require('../middleware/upload');
const { configureMulter, handleMulterErrors } = require('../middleware/multer');
const { permissionAccess } = require('../middleware/permissionAccess');
const path = require('path');

const multerMiddleware = configureMulter(
  path.join(__dirname, '../uploads/task/'),
  1024 * 1024 * 10,
  [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/pdf',
    'application/msword', // for .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // for .docx
  ]
);
const User_Task_Router = require('../controllers/User_Tasks.controller');
const router = express.Router();

router.post('/v1/add', uploadtask, User_Task_Router.postAddTaskStage); // save data
router.post('/v1/getTaskbyCompany', User_Task_Router.getAllTaskStagebyCompany); // save data
router.get('/v1/getbyID/:id', User_Task_Router.getTaskById); // save data
router.post('/v1/updateTask', uploadtask, User_Task_Router.postUpdateTask); // save data
router.post('/v1/deleteTask', User_Task_Router.postDeleteTaskById); // save data
router.get('/v1/getNextStageById/:id', User_Task_Router.getNextStageById); // save data
router.post('/v1/postUpdateTaskStage', User_Task_Router.postUpdateTaskStage); // save data
router.post('/v1/TaskAcceptReject', User_Task_Router.TaskAcceptReject); // save data
router.post('/v1/getTaskReport', User_Task_Router.getTaskReport); // Task Report

router.post(
  '/v2/add',
  multerMiddleware.array('attachment', 10),
  handleMulterErrors,
  permissionAccess,
  User_Task_Router.postAddTaskStageV2
); // save data

router.post('/v2/postUpdateTaskStage', User_Task_Router.postUpdateTaskStageV2); // save data

router.post(
  '/v2/updateTask',
  multerMiddleware.array('attachment', 10),
  handleMulterErrors,
  permissionAccess,
  User_Task_Router.postUpdateTask2
); // save data

router.post('/v2/deleteTask', User_Task_Router.postDeleteTaskById2); // save data

router.post('/v2/getTaskbyUser', User_Task_Router.getAllTaskStagebyUser2); // save data

router.post('/v3/getTaskbyUser', User_Task_Router.getAllTaskStagebyUserV3); // save data

router.get('/v1/addTaskToallCompany', User_Task_Router.addTaskToallCompany); // save data

router.post('/v1/getSubTaskByID', User_Task_Router.getSubTaskByID); // save data
router.post('/v1/getMainTaskByID', User_Task_Router.getMainTaskByID); // save data

router.post('/v2/getTaskbyCompany', User_Task_Router.getAllTaskStagebyCompany2); // save data

router.get('/v1/taskDashBoard', User_Task_Router.taskDashBoard);
router.get(
  '/v1/getTaskReportByCompany',
  User_Task_Router.getTaskReportByCompany
);

router.post('/v1/getTaskReportByUsers', User_Task_Router.getTaskReportByUsers);

router.get('/v1/pendingTaskDashBoard', User_Task_Router.pendingTaskDashBoard);

module.exports = router;
