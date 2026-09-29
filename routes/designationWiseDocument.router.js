const express = require('express');
const router = express.Router();
const designationWiseDocumentController = require('../controllers/designationWiseDocument.controller');
const { uploadfile } = require('../middleware/upload');
const { verifyToken } = require('../middleware/tokenverify');

router.post(
  '/v1/addDesignationWiseDocument',
  verifyToken,
  designationWiseDocumentController.addDesignationWiseDocument
);

router.get(
  '/v1/listDesignationWiseDocument',
  verifyToken,
  designationWiseDocumentController.listDesignationWiseDocument
);

router.get(
  '/v1/getjoiningDocumentTypeByCompanyMasterID',
  verifyToken,
  designationWiseDocumentController.getjoiningDocumentTypeByCompanyMasterID
);
router.get(
  '/v1/getdesignationWiseDocumentByDesignationID',
  verifyToken,
  designationWiseDocumentController.getdesignationWiseDocumentByDesignationID
);
router.post(
  '/v1/editDesignationWiseDocument',
  verifyToken,
  designationWiseDocumentController.editDesignationWiseDocument
);

router.post(
  '/v1/deleteDesignationWiseDocument',
  verifyToken,
  designationWiseDocumentController.deleteDesignationWiseDocument
);

router.get(
  '/v1/getDocumentByDesignationIDAndRequiredUserType',
  verifyToken,
  designationWiseDocumentController.getDocumentByDesignationIDAndRequiredUserType
);

router.get(
  '/v1/getDocumentByDesignationIDAndRequiredUserTypeOpen',
  designationWiseDocumentController.getDocumentByDesignationIDAndRequiredUserType
);


router.post('/v1/generateDemoExcel', verifyToken, designationWiseDocumentController.generateDemoExcel);

router.post('/v1/validateExcel', verifyToken, uploadfile, designationWiseDocumentController.validateUploadExcel);

router.post('/v1/revalidateDesignationWiseDocument', verifyToken, designationWiseDocumentController.revalidateDesignationWiseDocument);

router.post(
  "/v1/addValidateDesignationWiseDocument", verifyToken,
  designationWiseDocumentController.addValidateDesignationWiseDocument
);
module.exports = router;
