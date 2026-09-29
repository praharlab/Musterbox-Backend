const express = require('express');
const employeeTaxRegimeController = require('../controllers/employeeTaxRegime.controller');
const router = express.Router();

router.post('/v1/add', employeeTaxRegimeController.postAddData);
router.put('/v1/:id', employeeTaxRegimeController.updatedata);
router.get('/v1/getbyid/:id', employeeTaxRegimeController.getById);
router.delete('/v1/:id', employeeTaxRegimeController.deleteById);
router.post('/v1/getlist', employeeTaxRegimeController.getlistdata);
router.get(
  '/v1/getnonRegimeUserlist',
  employeeTaxRegimeController.getnonRegimeUserlist
);
router.get('/v1/getByUserId', employeeTaxRegimeController.getByUserId);

module.exports = router;
