const express = require('express');
const router = express.Router();
const auditLogsController = require('../controllers/auditLogs.controller');

router.post('/v1/getAll', auditLogsController.getAuditLogs);
router.get('/v1/getTableNames', auditLogsController.getUniqueTableNames);

module.exports = router;
