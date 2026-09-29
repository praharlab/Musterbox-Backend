const express = require('express');
const coffMaster = require('../controllers/coffMaster.controller');
const router = express.Router();

router.post('/v1/getallCoff', coffMaster.getAllCoff); //get all Coff data
router.post('/v1/deleteCoff', coffMaster.postDeleteCoff);
router.post('/v1/addCoff', coffMaster.postAddHrLeave);
router.post('/v1/getAllCoffbyCompany', coffMaster.getAllCoffByCompany);
router.post('/v1/addCoffmaster', coffMaster.postAddCoff);
router.post('/v1/addCoffmasterWithAuthorization', coffMaster.addCoffWithAuthorization);
router.get(
      '/v1/getCoffDataByUserMasterID',
      coffMaster.getCoffDataByUserMasterID
    );

module.exports = router;
