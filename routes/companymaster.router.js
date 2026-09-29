const express = require("express");
const companyMasterController = require("../controllers/companymaster.controller");
const router = express.Router();
const { uploadcompanylogo } = require("../middleware/upload");

router.post(
  "/v1/add",
  uploadcompanylogo,
  companyMasterController.postAddCompany
); // save data
router.post("/v1/getalldata", companyMasterController.getAllCompanyData); //get all company data
router.get(
  "/v1/getbyid/:id",

  companyMasterController.getCompanyById
); //get by id
router.post(
  "/v1/updatebyid",
  uploadcompanylogo,
  companyMasterController.postUpdatecompanyMaster
); //update company data
router.post("/v1/deletebyid", companyMasterController.postDeleteCompanyById); //delete by id
router.post("/v1/statuschange", companyMasterController.poststatuschange); //delete by id
router.post(
  "/v1/getCompanyByParentCompany",

  companyMasterController.getCompanyByParentCompany
); //delete by id
router.post("/v1/getCompanyById", companyMasterController.getCompanyById1); //delete by id
router.post("/v1/search", companyMasterController.postSearchCompanyMaster); //search
router.post("/v1/superadmin_dashboard", companyMasterController.dashboard); //dashboard

router.post(
  "/v1/getCompanyByParentCompany2",
  companyMasterController.getCompanyByParentCompany2
);
router.get(
  "/v1/getCompanyAnalyticsData",
  companyMasterController.getCompanyAnalyticsData
);

router.post(
  "/v1/getCompanyDataSubAdmin",
  companyMasterController.getCompanyDataSubAdmin
);

router.post(
  "/v1/postUpdateCustomerPreference",
  companyMasterController.postUpdateCustomerPreference
);

router.get(
  "/v1/getCompanySubscriptionPlanAnalyticsData",
  companyMasterController.getCompanySubscriptionPlanAnalyticsData
);

router.post(
  "/v1/listCompanySubscriptionPlanAnalyticsData",
  companyMasterController.listCompanySubscriptionPlanAnalyticsData
);

router.get(
  "/v1/getCompanySubscriptionPlanAnalyticsDataProductWise",
  companyMasterController.getCompanySubscriptionPlanAnalyticsDataProductWise
);
router.post("/v1/getCompanyTree", companyMasterController.getCompanyTree);

router.post("/v1/getUser", companyMasterController.getUser);

router.post("/v1/addIncentiveTypes", companyMasterController.addIncentiveTypes);

router.post(
  "/v1/getCompanyByParentCompany3",
  companyMasterController.getCompanyByParentCompany3
);
router.post(
  "/v1/removeCompanyLogoAndAuthSign",
  companyMasterController.removeCompanyLogoAndAuthSign
);
// To Add Attendance Bonus
router.post("/v1/addData", companyMasterController.addData);

// To Add Tea/Coffee Bonus
router.post("/v1/addExtraDaysIncentive", companyMasterController.addExtraDaysIncentive);
router.post("/v2/getalldata", companyMasterController.getAllCompanyDataV2); //get all company data

module.exports = router;
