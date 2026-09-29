const express = require('express');
const router = express.Router();
const weekoffShuffleController = require('../controllers/weekoffShuffle.controller');

router.post('/v1/add', weekoffShuffleController.postadd);

router.post('/v1/getdata', weekoffShuffleController.getdata);

router.delete('/v1/deletedata/:id', weekoffShuffleController.deletedatabyId);

router.post('/v1/changeWeekOff', weekoffShuffleController.changeWeekOff);

module.exports = router;
