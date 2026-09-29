const express = require('express');
const { getTrackingCategoryDetails, addTrackingCategoryDetail, updateTrackingDetail, deleteTrackingDetail, getTrackingCategoryDetailsById, updateTrackingOutageCategoryDetailsStatus } = require('../controllers/trackingCategoryDetails.controller');

const router = express.Router();

router.post('/v1/getTrackingCategoryDetails', getTrackingCategoryDetails);
router.post('/v1/addTrackingCategoryDetails', addTrackingCategoryDetail);
router.put('/v1/updateTrackingCategoryDetails', updateTrackingDetail);
router.delete('/v1/deleteTrackingCategoryDetails/:id', deleteTrackingDetail);
router.get('/v1/getTrackingCategoryDetailsById/:id', getTrackingCategoryDetailsById);
router.put('/v1/updateTrackingOutageCategoryDetailsStatus', updateTrackingOutageCategoryDetailsStatus);

module.exports = router;