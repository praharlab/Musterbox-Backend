const express = require('express');
const announcementController = require('../controllers/announcement.controller');
const router = express.Router();
const { upload_announcement_attachment } = require('../middleware/upload');

router.post(
  '/v1/add',
  upload_announcement_attachment,
  announcementController.postAddAnnouncement
); // save data
router.get('/v1/getbyid/:id', announcementController.getAnnouncementById); //get by id
router.post(
  '/v1/getbycompanyid',
  announcementController.getAnnouncementByCompanyId
); //get by company id
router.post('/v1/getbyuserId', announcementController.getAnnouncementByUserId); //get by user id
router.post(
  '/v1/countUnreadAnnouncement',
  announcementController.countUnreadAnnouncement
); //get by user id
router.post('/v1/updatebyid', announcementController.postUpdateAnnouncement); //update announcement data
router.post(
  '/v1/deletebyid',
  announcementController.postDeleteAnnouncementById
); //delete by id
router.post('/v1/statuschanges', announcementController.poststatuschange); //status change


module.exports = router;
