const express = require('express');

const DealerPlan = require('../controllers/dealerPlan.controller');
const router = express.Router();

router.post('/v1/add', DealerPlan.postadddata);

router.post('/v1/listdata', DealerPlan.listdata);

router.put('/v1/editdata/:id', DealerPlan.editdata);

router.delete('/v1/deletedata/:id', DealerPlan.deletedata);

router.get('/v1/getdata/:id', DealerPlan.getdata);

router.post('/v1/poststatuschange', DealerPlan.poststatuschange);
module.exports = router;
