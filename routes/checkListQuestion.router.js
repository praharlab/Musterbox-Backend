const express = require('express');
const CheckListQuestionController = require('../controllers/checkListQuestion.controller');
const router = express.Router();

router.post(
  '/v1/getAllCheckListQuestion',
  CheckListQuestionController.getAllCheckListQuestion
);
router.post(
  '/v1/postAddCheckListQuestion',
  CheckListQuestionController.postAddCheckListQuestion
);
router.get(
  '/v1/getCheckListQuestionById/:id',
  CheckListQuestionController.getCheckListQuestionById
);
router.post(
  '/v1/postUpdateCheckListQuestion',
  CheckListQuestionController.postUpdateCheckListQuestion
);
router.post(
  '/v1/poststatuschangeCheckListQuestion',
  CheckListQuestionController.poststatuschangeCheckListQuestion
);
router.get(
  '/v1/getCheckListQuestionByuserId/:id',
  CheckListQuestionController.getCheckListQuestionByuserId
);

module.exports = router;
