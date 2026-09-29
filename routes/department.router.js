const express = require('express');
const departmentController = require('../controllers/department.controller');
const router = express.Router();
const { uploadfile } = require('../middleware/upload');

router.post('/v1/add', departmentController.postAddDepartment); // save data
router.get('/v1/getbyid/:id', departmentController.getDepartmentId); //get by id
router.post('/v1/updatebyid', departmentController.postUpdateDepartment); //update companytype tax data
router.post('/v1/deletebyid', departmentController.postDeleteDepartmentById); //delete by id
router.post('/v1/statuschanges', departmentController.poststatuschange); //status by id
router.post(
  '/v1/getDepartmentcompanyid',
  departmentController.getDepartmentcompanyid
); //get by id
router.get(
  '/v1/getDepartmentByCompanyId/:id',
  departmentController.getDepartmentByCompanyId
); //get by id
router.get(
  '/v1/getactivedepartmentbycompanyid/:id',
  departmentController.getactivedepartmentbycompanyid
);
router.post('/v1/uploadexcel', uploadfile, departmentController.uploadexcel);
router.post('/v1/validateExcel', uploadfile, departmentController.validateUploadExcel);

router.post('/v1/reValidateDepartment', departmentController.revalidateDepartment);

router.post('/v1/addValidateDepartment', departmentController.addValidateDepartment)

module.exports = router;
