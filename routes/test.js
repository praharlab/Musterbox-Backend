const express = require('express');
const testController = require('../controllers/testController');
const router = express.Router();

//Get All Data

router.get('/getr', testController.getData);
router.post('/getr', testController.getData);
router.delete('/getr', testController.getData);
router.put('/getr', testController.getData);

module.exports = router;
