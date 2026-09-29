const express = require('express');
const preboardingController = require('../controllers/preboarding.controller');
const { verifyToken } = require('../middleware/tokenverify');
const router = express.Router();

router.post('/v1/add', preboardingController.postAddPreboarding); // save data

router.get(
  '/v1/getbyid/:id',
  verifyToken,
  preboardingController.getPreboardingById
); //get by id
router.post(
  '/v1/updatebyid',
  verifyToken,
  preboardingController.postUpdatePreboarding
); //update visit data
router.post(
  '/v1/onboardStatusChange',
  verifyToken,
  preboardingController.onboardStatusChange
); //delete by id

router.post(
  '/v1/getbycompanyid',
  verifyToken,
  preboardingController.getPreboardingByCompanyId
); //status change

router.get(
  '/v1/preBoardingFormDownload',
  preboardingController.preBoardingFormDownload
); //downlaod the form

router.post(
  '/v1/addPreboardingMaster',
  verifyToken,
  preboardingController.addPreboardingMaster
);
router.post(
  '/v1/updatePreboardingMaster',
  verifyToken,
  preboardingController.updatePreboardingMaster
);
router.post(
  '/v1/deletePreboardingMaster',
  verifyToken,
  preboardingController.deletePreboardingMaster
);
router.post(
  '/v1/getPreboardingMaster',
  preboardingController.getPreboardingMaster
);

router.post(
  '/v1/getPreboardingOfferLetter',
  preboardingController.getPreboardingOfferLetter
);

router.post(
  '/v1/updateOfferLetter',
  verifyToken,
  preboardingController.updatePreboardingOfferLetter
);

router.post(
  '/v1/updateOfferLetter',
  verifyToken,
  preboardingController.updatePreboardingOfferLetter
);

router.post(
  '/v1/mailSendForAcceptance',
  verifyToken,
  preboardingController.sendMailForAcceptance
)

router.get(
  '/offer-response/:signedData',
  preboardingController.getOfferResponse
);

router.post(
  '/v1/mailSendForPreBoardingDocs',
  verifyToken,
  preboardingController.sendMailForPrebordingDocs
)
module.exports = router;
