const express = require("express");
const userleaveController = require("../controllers/userleave.controller");
const router = express.Router();
const { configureMulter, handleMulterErrors } = require("../middleware/multer");
const { permissionAccess } = require("../middleware/permissionAccess");
const { uploadfile } = require("../middleware/upload");
const path = require("path");

const multerMiddleware = configureMulter(
  path.join(__dirname, "../uploads/employee-leave-attachment"),
  1024 * 1024 * 10,
  ["image/jpeg", "image/png", "image/jpg", "application/pdf"]
);

router.post("/v1/add", permissionAccess, userleaveController.postAddLeave); //save the data Not Used
router.post(
  "/v1/bulk/add",
  permissionAccess,
  userleaveController.postBulkAddLeave
); //Bulk Save the data  Not Used

router.post(
  "/v2/bulk/add",
  multerMiddleware.array("attachment", 10),
  handleMulterErrors,
  permissionAccess,
  userleaveController.postBulkAddLeave_Web
); //Bulk Save the data

// router.post(
//   '/v2/bulk/manualAdd',
//   multerMiddleware.array('attachment', 10),
//   handleMulterErrors,
//   permissionAccess,
//   userleaveController.postBulkAddLeave_Manual
// ); //Bulk Save the data

router.post(
  "/v1/getalldata",
  permissionAccess,
  userleaveController.getAllUserLeaveData
); //get the data
router.get(
  "/v1/getbyid/:id",
  permissionAccess,
  userleaveController.getLeaveById
); //get data by userleaveappid
router.post(
  "/v1/update",
  multerMiddleware.single("attachment"),
  handleMulterErrors,
  permissionAccess,
  userleaveController.updateUserData
); //update the data by id
router.post(
  "/v1/status",
  permissionAccess,
  userleaveController.poststatuschange
); //update the status
router.get(
  "/v1/getbycompanyid",
  permissionAccess,
  userleaveController.getuserleaveCompanyId
); //get by company id
router.get(
  "/v1/delete/:id",
  permissionAccess,
  userleaveController.deleteUserData
); //delete data
router.post(
  "/v1/LeaveByUser",
  permissionAccess,
  userleaveController.getLeaveByUserId
);

router.get(
  "/v1/LeavedetailById/:id",
  permissionAccess,
  userleaveController.getLeaveByLeaveId
);
router.get(
  "/v1/getLeaveByUserId/:id",
  permissionAccess,
  userleaveController.getapprovedLeaveByUserId
);

router.get(
  "/v1/lapseLeaveBalance",
  permissionAccess,
  userleaveController.lapseLeaveBalance
);

router.get(
  "/v1/getUserLeaveBalance",
  permissionAccess,
  userleaveController.getUserLeaveBalance
);

router.get(
  "/v1/getOptionalLeaveByUserId",
  userleaveController.getOptionalLeaveByUserId
);
router.post(
  "/v1/validateExcel",
  uploadfile,
  userleaveController.validateUploadExcel
);

router.post(
  "/v1/revalidateManualLeave",
  userleaveController.revalidateManualLeave
);

router.post(
  "/v1/addValidateManualLeave",
  userleaveController.addValidateManualLeave
);

router.post("/v1/generateDemoExcel", userleaveController.generateDemoExcel);

router.post("/v1/add_Outdoor_Duty", userleaveController.addOutdoorDuty);

router.put(
  "/v1/update_Outdoor_Duty/:id",
  userleaveController.updateOutdoorDuty
);

router.post(
  "/v1/listOutdoorDutyUserWise",
  userleaveController.listOutdoorDutyUserWise
);

// ------------------------------ Lapse leave Balance --------------------- companyId and LeaveId wise-------------
router.post(
  "/v1/lapseLeaveBalanceLeaveId",
  userleaveController.lapseLeaveBalanceLeaveId
);

router.post(
  "/v2/LeaveByUser",
  permissionAccess,
  userleaveController.getLeaveByUserId_V2
);

router.post(
  "/v1/getAllUserLeavesBalanceData",
  userleaveController.getAllUserLeavesBalanceData
);

router.post(
  "/v1/getUserLeavesData",
  userleaveController.getUserLeavesData
);

router.post(
  "/v1/manageLeaveBalance",
  userleaveController.manageLeaveBalance
);
module.exports = router;
