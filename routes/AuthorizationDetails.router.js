const express = require("express");
const AuthorizationDetailsController = require("../controllers/authorizationDetails.controller");
const router = express.Router();

router.post(
  "/v1/add",
  AuthorizationDetailsController.postAddAuthorizationDetails
); // save data
router.post(
  "/v1/getalldata",
  AuthorizationDetailsController.getAuthorizationDetails
); // all data
router.post(
  "/v1/deletebyid",
  AuthorizationDetailsController.postDeleteAuthorizationDetailsById
); // delete by id data
router.post(
  "/v1/statuschanges",
  AuthorizationDetailsController.poststatuschange
); // delete by id data
router.get(
  "/v1/getbyid/:id",
  AuthorizationDetailsController.getAuthorizationDetailsById
); // get by id data
router.post(
  "/v1/updatebyid",
  AuthorizationDetailsController.postUpdateAuthorizationDetails
); // get by id data

router.post(
  "/v1/nonauthorizeduser",
  AuthorizationDetailsController.nonauthorizeduser
);

router.post("/v1/getAuthList", AuthorizationDetailsController.getAuthList);

router.post("/v1/replaceAuth", AuthorizationDetailsController.replaceAuth);

router.post(
  "/v1/getAuthorizationDetailsByAuthorizedByUserMasterId",
  AuthorizationDetailsController.getAuthorizationDetailsByAuthorizedByUserMasterId
);

router.post("/v1/deleteAuth", AuthorizationDetailsController.deleteAuth);

module.exports = router;
