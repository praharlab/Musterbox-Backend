const express = require("express");
const tpMirrorControler = require("../controllers/tpMirrior.controller");
const router = express.Router();

router.post("/v1/tpMirrorConvertImage", tpMirrorControler.tpMirrorConvertImage);

module.exports = router;
