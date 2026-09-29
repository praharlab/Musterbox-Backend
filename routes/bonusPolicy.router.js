const express = require('express');
const bonusPolicyController = require('../controllers/bonusPolicy.controller');
const router = express.Router();


router.post('/v1/add', bonusPolicyController.addData); // save data
router.put('/v1/update/:id', bonusPolicyController.updateData); // update data
router.post('/v1/listdata', bonusPolicyController.listdata); // list data
router.get('/v1/getById/:id', bonusPolicyController.getById); // get data
router.delete('/v1/delete/:id', bonusPolicyController.deletedata);
router.post('/v1/poststatuschange', bonusPolicyController.poststatuschange);
router.get('/v1/getActiveBonusPolicyByCompanyId/:id', bonusPolicyController.getActiveBonusPolicyByCompanyId); 


module.exports = router;