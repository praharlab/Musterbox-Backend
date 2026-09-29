const express = require('express');
const tdsSubSectionCategoryController = require('../controllers/tdsSubSectionCategory.controller');
const router = express.Router();

router.post('/v1/add', tdsSubSectionCategoryController.addData);
router.put('/v1/update/:id', tdsSubSectionCategoryController.updateData);
router.get('/v1/getById/:id', tdsSubSectionCategoryController.getById);
router.delete('/v1/delete/:id', tdsSubSectionCategoryController.deleteById);
router.get('/v1/getlist', tdsSubSectionCategoryController.getlist);

module.exports = router;
