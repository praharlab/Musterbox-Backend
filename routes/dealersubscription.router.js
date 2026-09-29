const express = require('express');

// const DealerPlan = require('../controllers/dealerPlan.controller');
const DealerSubscription = require('../controllers/dealersubscription.controller');
const router = express.Router();

router.post('/v1/add', DealerSubscription.postadddata);

router.post('/v1/listdata', DealerSubscription.listdata);

router.get('/v1/getdata/:id', DealerSubscription.getdataid);

router.put('/v1/editdata/:id', DealerSubscription.editdata);
module.exports = router;
