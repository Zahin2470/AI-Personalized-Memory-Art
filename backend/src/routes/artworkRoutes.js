const express = require('express');
const {
  createArtwork,
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
router.put('/:id/favorite', toggleFavorite);
router.delete('/:id', deleteArtwork);

module.exports = router;
