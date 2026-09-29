const express = require('express');
const { getTrackingOutageCategory, addTrackingOutageCategory, updateTrackingOutageCategory, deleteTrackingOutageCategory, getTrackingOutageCategoryById, updateTrackingOutageCategoryStatus } = require('../controllers/trackingOutageCategory.controller');

const router = express.Router();

router.post('/v1/getTrackingOutageCategories', getTrackingOutageCategory);
router.post('/v1/addTrackingOutageCategories', addTrackingOutageCategory);
router.put('/v1/updateTrackingOutageCategories', updateTrackingOutageCategory);
router.delete('/v1/deleteTrackingOutageCategories/:id', deleteTrackingOutageCategory);
router.get('/v1/getTrackingOutageCategoryById/:id', getTrackingOutageCategoryById);
router.put('/v1/updateTrackingOutageCategoryStatus', updateTrackingOutageCategoryStatus);

module.exports = router;