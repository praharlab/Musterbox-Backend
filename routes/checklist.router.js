const express = require('express');
const CheckListController = require('../controllers/checklist.controller');
const router = express.Router();

router.post('/v1/getAllCheckList', CheckListController.getAllCheckList);
router.post('/v1/postAddCheckList', CheckListController.postAddCheckList);
router.get('/v1/getCheckListById/:id', CheckListController.getCheckListById);
router.post('/v1/postUpdateCheckList', CheckListController.postUpdateCheckList);
router.post('/v1/poststatuschange', CheckListController.poststatuschange);

module.exports = router;
