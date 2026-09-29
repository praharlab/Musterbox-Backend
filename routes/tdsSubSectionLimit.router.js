const express = require('express');
const tdsSubSectionLimitController = require('../controllers/tdsSubSectionLimit.controller');
const router = express.Router();

router.post('/v1/add', tdsSubSectionLimitController.addData);
router.put('/v1/update/:id', tdsSubSectionLimitController.updateData);
router.get('/v1/getById/:id', tdsSubSectionLimitController.getById);
router.delete('/v1/delete/:id', tdsSubSectionLimitController.deleteById);
router.get('/v1/getlist', tdsSubSectionLimitController.getlist);

// -- for add limit data --------------------

router.post('/v1/addLimitData',tdsSubSectionLimitController.addLimitData);

module.exports = router;