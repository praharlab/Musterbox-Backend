const express = require("express");
const visitorscontroller = require("../controllers/visitors.controller");
const router = express.Router();
const { uploadfile } = require("../middleware/upload");
const { configureMulter, handleMulterErrors } = require("../middleware/multer");
const path = require("path");

const multerMiddleware = configureMulter(
  path.join(__dirname, "../uploads/visitors/"),
  1024 * 1024 * 10,
  ["image/jpeg", "image/png", "image/jpg"]
);

router.post(
  "/v1/add",
  multerMiddleware.single("visitorPhoto"),
  handleMulterErrors,
  visitorscontroller.postAddvisitors
); // save data
router.get("/v1/getbyid/:id", visitorscontroller.getvisitorsId); //get by id
router.post(
  "/v1/updatebyid",
  multerMiddleware.single("visitorPhoto"),
  handleMulterErrors,
  visitorscontroller.postUpdatevisitors
); //update companytype tax data
router.post("/v1/deletebyid", visitorscontroller.postDeletevisitorsById); //delete by id
router.post("/v1/statuschanges", visitorscontroller.poststatuschange); //status by id
router.post(
  "/v1/getvisitorscompanyid",
  visitorscontroller.getvisitorscompanyid
); //get by id
router.get(
  "/v1/getvisitorsByCompanyId/:id",
  visitorscontroller.getvisitorsByCompanyId
); //get by id
router.get(
  "/v1/getactivedepartmentbycompanyid/:id",
  visitorscontroller.getactivevisitorsbycompanyid
);
router.post("/v1/uploadexcel", uploadfile, visitorscontroller.uploadexcel); //upload excel

router.post(
  "/v1/validateExcel",
  uploadfile,
  visitorscontroller.validateUploadExcel
);

router.post("/v1/revalidateVisitors", visitorscontroller.revalidateVisitors);

router.post("/v1/addValidateVisitors", visitorscontroller.addValidateVisitors);

module.exports = router;
