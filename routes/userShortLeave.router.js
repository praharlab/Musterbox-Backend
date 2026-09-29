const express = require("express");
const userShortLeave = require("../controllers/userShortLeave.controller");
const router = express.Router();

router.post("/v1/add", userShortLeave.add);
router.put("/v1/update/:id", userShortLeave.update);
router.delete("/v1/delete/:id", userShortLeave.delete);

router.post("/v1/listDataByUser", userShortLeave.listDataByUser);
router.get("/v1/getById/:id", userShortLeave.getById);

module.exports = router;
