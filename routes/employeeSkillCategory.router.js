const express = require('express');
const EmployeeSkillCategoryController = require('../controllers/employeeSkillCategory.controller');
const router = express.Router();

router.post('/v1/addData', EmployeeSkillCategoryController.addData);
router.get(
  '/v1/getByUserId/:id',
  EmployeeSkillCategoryController.getByUserId
);
router.post('/v1/delete',EmployeeSkillCategoryController.delete);
router.post('/v1/getAllUsersSkillCategory',EmployeeSkillCategoryController.getAllUsersSkillCategory);

module.exports = router;
