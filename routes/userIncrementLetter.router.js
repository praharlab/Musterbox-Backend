const express = require('express');
const UserIncrementLetter = require('../controllers/userIncrement.controller');
const router = express.Router();
const { uploadtask } = require('../middleware/upload');

router.post('/v1/add', uploadtask, UserIncrementLetter.postAddIncrementLetters); //save the data
router.post('/v1/getAllLetter', UserIncrementLetter.getAllIncrementLetter); //save the data
router.post(
  '/v1/updateLetter',
  UserIncrementLetter.postUpdateUserIncrementLetters
); //save the data
router.post('/v1/delete', UserIncrementLetter.postDeleteIncrementLetters);
router.post(
  '/v1/incrementeemail',
  UserIncrementLetter.sendEmailIncrementLetter
);

module.exports = router;
