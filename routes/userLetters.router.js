const express = require('express');
const UserLetters = require('../controllers/userLetters.controller');
const router = express.Router();
const { uploadtask } = require('../middleware/upload');

router.post('/v1/add', uploadtask, UserLetters.postAddUserLetters); //save the data
router.post('/v1/getAllUserLetter', UserLetters.getAllUserLetter); //save the data
router.post('/v1/delete', UserLetters.postDeleteUserLetters); //save the data
router.post('/v1/postUpdateUserLetters', UserLetters.postUpdateUserLetters); //save the data

router.post('/v1/offeremail', UserLetters.sendEmailOfferLetter);
router.post('/v1/joinigemail', UserLetters.sendEmailJoinigLetter);

router.post('/v1/experienceemail', UserLetters.sendEmailExperienceLetter);
router.post('/v1/termination', UserLetters.sendEmailTerminationLetter);
router.post('/v1/appointment', UserLetters.sendEmailAppointmentLetter);

module.exports = router;
