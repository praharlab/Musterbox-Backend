const express = require('express');
const meetingplaceController = require('../controllers/meetingPlace.controller');
const router = express.Router();
const { uploadfile } = require('../middleware/upload');

router.post('/v1/add', meetingplaceController.postAddmeetingPlace); // save data
router.get('/v1/getbyid/:id', meetingplaceController.getmeetingPlaceId); //get by id
router.post('/v1/updatebyid', meetingplaceController.postUpdatemeetingPlace); //update companytype tax data
router.post(
  '/v1/deletebyid',
  meetingplaceController.postDeletemeetingPlaceById
); //delete by id
router.post('/v1/statuschanges', meetingplaceController.poststatuschange); //status by id
router.post(
  '/v1/getmeetingPlacecompanyid',
  meetingplaceController.getmeetingPlacecompanyid
); //get by id
router.get(
  '/v1/getmeetingPlaceByCompanyId/:id',
  meetingplaceController.getmeetingPlaceByCompanyId
); //get by id
router.get(
  '/v1/getactivedepartmentbycompanyid/:id',
  meetingplaceController.getactivemeetingPlacebycompanyid
);
router.post('/v1/uploadexcel', uploadfile, meetingplaceController.uploadexcel); //upload excel

router.post('/v1/validateExcel', uploadfile, meetingplaceController.validateUploadExcel);

router.post('/v1/reValidateMeetingPlace', meetingplaceController.reValidateMeetingPlace);

router.post('/v1/addValidateMeetingPlace', meetingplaceController.addValidateMeetingPlace)

module.exports = router;
