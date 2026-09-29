const express = require("express");
const DistrictController = require("../controllers/districtMaster.controller");
const router = express.Router();

router.post("/v1/addDistrict", DistrictController.addDistrict); // save data
router.post("/v1/listDistrictData", DistrictController.listDistrictData); //get all district data
router.get("/v1/getDistrictByID", DistrictController.getDistrictByID); //get by id
router.post("/v1/updateDistrict", DistrictController.updateDistrict); //update district data

router.get(
  "/v1/getdistrictByStateIdyID",
  DistrictController.getDistrictByStateID
); //get by id
module.exports = router;
