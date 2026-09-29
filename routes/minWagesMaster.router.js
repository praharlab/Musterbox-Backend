const express = require('express');
const router = express.Router();
const minWagesMasterController = require('../controllers/minWagesMaster.controller');


router.post('/v1/addData', minWagesMasterController.addData);
router.get('/v1/getById/:id', minWagesMasterController.getById);
router.put('/v1/updateData/:id', minWagesMasterController.updateData);
router.delete('/v1/delete/:id', minWagesMasterController.delete);
router.post('/v1/list', minWagesMasterController.list);


module.exports = router;