const express = require('express');
const { getTimeline } = require('../controllers/timelineController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getTimeline);

module.exports = router;
