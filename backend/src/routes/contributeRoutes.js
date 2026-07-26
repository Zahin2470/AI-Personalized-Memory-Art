const express = require('express');
const { getInviteInfo, addContribution } = require('../controllers/contributeController');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/:token', getInviteInfo);
router.post('/:token', upload.single('photo'), addContribution);

module.exports = router;
