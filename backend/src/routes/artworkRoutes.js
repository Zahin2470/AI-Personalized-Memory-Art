const express = require('express');
const {
  createArtwork,
  regenerateArtwork,
  getArtworks,
  getArtwork,
  toggleFavorite,
  deleteArtwork,
} = require('../controllers/artworkController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', createArtwork);
router.get('/', getArtworks);
router.get('/:id', getArtwork);
router.post('/:id/regenerate', regenerateArtwork);
router.put('/:id/favorite', toggleFavorite);
router.delete('/:id', deleteArtwork);

module.exports = router;
