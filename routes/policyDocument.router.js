const express = require('express');
const { configureMulter, handleMulterErrors } = require('../middleware/multer');
const policyDocuments = require('../controllers/policyDocument.controller');
const { verifyChildParent } = require('../middleware/verifyChildParent');
const { roles } = require('../utils/commonVars');
const path = require('path');

const multerMiddleware = configureMulter(
  path.join(__dirname, '../uploads/policy-documents'),
  1024 * 1024 * 10,
  [
    'image/jpeg',
    'image/png',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]
);
const router = express.Router();
router.get('/v1', verifyChildParent, policyDocuments.listPolicyDocument);
router.get(
  '/v1/:id',
  verifyChildParent,
  policyDocuments.getPolicyDocumentDetails
);
router.post(
  '/v1',
  verifyChildParent,
  multerMiddleware.single('document'),
  handleMulterErrors,
  policyDocuments.createPolicyDocument
);
router.put(
  '/v1/:id',
  verifyChildParent,
  multerMiddleware.single('document'),
  handleMulterErrors,
  policyDocuments.updatePolicyDocument
);
router.delete(
  '/v1/:id',
  verifyChildParent,
  policyDocuments.deletePolicyDocument
);
module.exports = router;
