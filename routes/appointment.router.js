const express = require('express');
const AppointmentLetter = require('../controllers/appointment.controller');
const router = express.Router();

router.post('/v1/add', AppointmentLetter.addAppointmentLetter);
router.put('/v1/update', AppointmentLetter.updateAppointmentLetter);
router.post('/v1/delete', AppointmentLetter.deleteAppointmentLetter);
router.post('/v1/get', AppointmentLetter.getAppointmentLetter);

module.exports = router;
