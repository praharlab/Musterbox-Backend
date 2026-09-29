const express = require("express");
const datewiseAttendancepolicycontroller = require("../controllers/datewiseAttendancepolicy.controller");
const router = express.Router();

router.post(
  "/v1/add",
  datewiseAttendancepolicycontroller.postadddatewisepolicy
); // save data

router.get("/v1/getid/:id", datewiseAttendancepolicycontroller.getById); //get by user id primary key

router.post(
  "/v1/updatebyid",
  datewiseAttendancepolicycontroller.datewiseupdateData
); // update data
router.post("/v1/deletebyid", datewiseAttendancepolicycontroller.postDelete); // delete by id

router.post(
  "/v1/getalldatabyid",
  datewiseAttendancepolicycontroller.getalldatabyid
);
module.exports = router;
