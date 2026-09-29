const express = require('express');
const TrackingController = require('../controllers/tracking.controller');
const router = express.Router();

router.post('/v1/savedata', TrackingController.postTracking);
router.post('/v1/savedatabulk', TrackingController.postTrackingBulk);
router.post('/v1/update', TrackingController.postUpdate);
router.post('/v1/delete', TrackingController.postDelete);
router.post('/v1/status_change', TrackingController.poststatus),
  router.post('/v1/getByUserId', TrackingController.getByUserId),
  router.post(
    '/v1/getUserTrackingInfoById',
    TrackingController.getUserTrackingInfoById
  ),
  router.post(
    '/v1/postTrackingBulkDayWise',
    TrackingController.postTrackingBulkDayWise
  );
router.post('/v1/getUserTrackingInfo', TrackingController.getUserTrackingInfo);
router.post(
  '/v1/getActiveUserandTrackingUserCount',
  TrackingController.getActiveUserandTrackingUserCount
);

router.post(
  '/v1/getTrackingGeoFenceWiseData',
  TrackingController.getTrackingGeoFenceWiseData
);
module.exports = router;
