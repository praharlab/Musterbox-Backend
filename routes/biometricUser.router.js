const express = require('express');
const biometricUserController = require('../controllers/biometricUser.controller');
const router = express.Router();
const { configureMulter, handleMulterErrors } = require('../middleware/multer');
const path = require('path');

const multerMiddleware = configureMulter(
  path.join(__dirname, '../uploads/biometricUser'),
  1024 * 1024 * 10,
  ['image/jpeg', 'image/png', 'image/jpg']
);
// 1024 * 1024 * 10,
router.post(
  '/v1/add',
  multerMiddleware.single('face'),
  handleMulterErrors,
  biometricUserController.postadd
);
router.post('/v1/get', biometricUserController.listdata);
router.post('/v1/syncbiometric', biometricUserController.syncbiometric);
router.post('/v1/deletebiometric', biometricUserController.deletebiometric);
router.post(
  '/v1/update',
  multerMiddleware.single('face'),
  handleMulterErrors,
  biometricUserController.changeRecord
);

router.post('/v1/getById/:id', biometricUserController.getById);
router.post('/v1/transferUser', biometricUserController.transferUser);

module.exports = router;
