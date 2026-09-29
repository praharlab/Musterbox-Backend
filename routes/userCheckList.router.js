const express = require('express');
const UserChecklist = require('../controllers/userCheckList.controller');
const router = express.Router();

router.post('/v1/AddUserChecklist', UserChecklist.AddUserChecklist);
router.get('/v1/getByIdUserChecklist/:id', UserChecklist.getByIdUserChecklist);
router.post(
  '/v1/updateByIdUserChecklist',
  UserChecklist.updateByIdUserChecklist
);
router.post('/v1/getByUserChecklist', UserChecklist.getByUserChecklist);
router.get('/v1/getCheckListbyUserID/:id', UserChecklist.getCheckListbyUserID);
router.post('/v1/listAdminCheckList', UserChecklist.listAdminCheckList);
router.post(
  '/v1/getByDateandUserIDUserChecklist',
  UserChecklist.getByDateandUserIDUserChecklist
);

module.exports = router;
