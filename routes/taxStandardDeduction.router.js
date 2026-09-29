const express = require('express');
const router = express.Router();
const taxStandardDeductionController = require('../controllers/taxStandardDeduction.controller');

router.post('/v1/add', taxStandardDeductionController.addData); 
router.put('/v1/update/:id', taxStandardDeductionController.updateData); 
router.delete('/v1/delete/:id', taxStandardDeductionController.deleteData); 
router.post('/v1/list', taxStandardDeductionController.listData); 
router.get('/v1/getById/:id', taxStandardDeductionController.getById); 



module.exports = router;