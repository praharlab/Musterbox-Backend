const express = require('express');
const resignProcess = require('../controllers/resignProcess.controller');
const { configureMulter, handleMulterErrors } = require('../middleware/multer');

const router = express.Router();
const path = require('path');

const multerMiddleware = configureMulter(
  path.join(__dirname, '../uploads/resignation'),
  1024 * 1024 * 10,
  ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
);

router.post(
  '/v1/addresignProcess',
  multerMiddleware.array('attachment', 10),
  handleMulterErrors,
  resignProcess.postAddResignProcess
);
// router.post(
//   '/v1/addresignTask',
//   multerMiddleware.array('attachment', 10),
//   handleMulterErrors,
//   resignProcess.postAddResignProcess2
// );
router.post('/v1/getAllresignProcess', resignProcess.getAllresignProcess);
router.post(
  '/v1/getAllresignProcesswithtask',
  resignProcess.getAllresignProcesswithtask
);
router.post('/v1/statusChanged', resignProcess.poststatus);
router.post('/v1/update', resignProcess.postUpdateResignProcess);

router.get('/v1/getbyid/:id', resignProcess.getResignationTaskById);
router.get(
  '/v1/resignProcessbyid/:id',
  resignProcess.getResignationProcessById
);
router.put('/v1/updateResignProcess/:id', resignProcess.updateResignProcess);
module.exports = router;
