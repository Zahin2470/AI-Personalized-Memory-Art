const express = require('express');
const {
  createMemory,
  getMemories,
  getMemory,
  sealMemory,
  unsealMemory,
  createInvite,
  getContributions,
  transcribeMemory,
  analyzeMemory,
  updateMemory,
  deleteMemory,
} = require('../controllers/memoryController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(protect); // every memory route requires a logged-in user

router.post(
  '/',
  upload.fields([
    { name: 'photos', maxCount: 10 },
    { name: 'voiceNote', maxCount: 1 },
  ]),
  createMemory
);
router.get('/', getMemories);
router.get('/:id', getMemory);
router.put('/:id/seal', sealMemory);
router.delete('/:id/seal', unsealMemory);
router.post('/:id/invite', createInvite);
router.get('/:id/contributions', getContributions);
router.post('/:id/transcribe', transcribeMemory);
router.post('/:id/analyze', analyzeMemory);
router.put('/:id', updateMemory);
router.delete('/:id', deleteMemory);

module.exports = router;
