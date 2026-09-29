const express = require("express");
const ProjectController = require("../controllers/project.controller");
// const { verifyChildParent } = require('../middleware/verifyChildParent');
const { uploadfile } = require("../middleware/upload");
const router = express.Router();

router.post("/v1/addProject", ProjectController.addProject);

router.post("/v1/listProjects", ProjectController.listProjects);

router.get("/v1/getProjectByID", ProjectController.getProjectByID);

router.post("/v1/updateProject", ProjectController.updateProject);

router.post("/v1/deleteProject", ProjectController.deleteProject);

router.post("/v1/updateProjectStatus", ProjectController.updateProjectStatus);

router.post("/v1/demoProjectExcel", ProjectController.demoProjectExcel);

router.post(
  "/v1/validateExcel",
  uploadfile,
  ProjectController.validateUploadExcel
);

router.post("/v1/revalidateProject", ProjectController.revalidateProject);

router.post("/v1/addValidateProject", ProjectController.addValidateProject);
router.get("/v1/syncProject", ProjectController.syncProject);
module.exports = router;
