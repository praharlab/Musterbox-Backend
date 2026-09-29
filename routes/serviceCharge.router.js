const express = require('express');
const serviceChargeController = require('../controllers/serviceCharge.controller');

const router = express.Router();

router.post('/v1/add', serviceChargeController.addData);
router.put('/v1/update/:id', serviceChargeController.updateData);
router.delete('/v1/delete/:id', serviceChargeController.deleteData);
router.get('/v1/getById/:id', serviceChargeController.getByIdData);
router.post('/v1/list',serviceChargeController.listData);



module.exports = router;