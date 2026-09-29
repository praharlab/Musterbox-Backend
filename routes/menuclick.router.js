const express = require('express');
const { addMenuClick, getRecentMenus } = require('../controllers/menuClick.controller');

const router = express.Router();

router.post('/v1/addClick', addMenuClick);
router.get('/v1/getRecentMenu/:id', getRecentMenus);


module.exports = router;