const express = require('express');
const router = express.Router();
const JoiningDocumentController = require('../controllers/joiningDocument.controller');
const { uploadfile } = require('../middleware/upload');
const { configureMulter, handleMulterErrors } = require('../middleware/multer');
const path = require('path');

const multerMiddleware = configureMulter(
  path.join(__dirname, '../uploads/user/document/'),
  1024 * 1024 * 10,
  ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
);

router.post(
  '/v1/addJoiningDocument',
  multerMiddleware.array('attachment', 10),
  handleMulterErrors,
  JoiningDocumentController.addJoiningDocument
);

router.get(
  '/v1/getJoiningDocumentByUserMasterID',
  JoiningDocumentController.getJoiningDocumentByUserMasterID
);
router.post(
  '/v1/deleteJoiningDocument',
  JoiningDocumentController.deleteJoiningDocument
);
router.get(
  '/v1/getJoiningDocumnetByID',
  JoiningDocumentController.getJoiningDocumnetByID
);

router.post(
  '/v1/editJoiningDocument',
  multerMiddleware.array('attachment', 10),
  handleMulterErrors,
  JoiningDocumentController.editJoiningDocument
);

router.post(
  '/v1/renewJoiningDocument',
  multerMiddleware.array('attachment', 10),
  handleMulterErrors,
  JoiningDocumentController.renewJoiningDocument
);

router.get(
  '/v1/getJoiningDocumnetHistroyByID',
  JoiningDocumentController.getJoiningDocumnetHistoryByID
);

router.post(
  '/v1/expiryJoiningDocument',
  JoiningDocumentController.expiryJoiningDocument
);

router.get(
  '/v1/expiryJoiningDocumentCron',
  JoiningDocumentController.expiryJoiningCron
);

module.exports = router;
