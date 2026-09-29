const express = require('express');
const SiteController = require('../controllers/site.controller');

const router = express.Router();

router.post(
  '/v1/addSite',
  SiteController.addSite
);
router.post(
  '/v1/listSite',
  SiteController.listSite
);
router.get(
  '/v1/getSiteByID/:id',
  SiteController.getSiteByID
);
router.put(
  '/v1/editSite',
  SiteController.editSite
);
router.post(
  '/v1/deleteSite',
  SiteController.deleteSite
);


module.exports = router;
