const express = require('express');
const router = express.Router();
const taxRebateController = require('../controllers/taxRebate.controller');

router.post('/v1/add', taxRebateController.addData); 
router.put('/v1/update/:id', taxRebateController.updateData); 
router.delete('/v1/delete/:id', taxRebateController.deleteData); 
router.post('/v1/list', taxRebateController.listData); 
router.get('/v1/getById/:id', taxRebateController.getById); 

module.exports = router;