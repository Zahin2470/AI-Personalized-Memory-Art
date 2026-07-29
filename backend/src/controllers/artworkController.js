const asyncHandler = require('express-async-handler');
const Memory = require('../models/Memory');
const Artwork = require('../models/Artwork');
const aiServiceClient = require('../services/aiServiceClient');
const { notify } = require('../services/notify');

const { ART_STYLES } = Artwork;

// Shared by createArtwork and regenerateArtwork so the "call the AI service,
// build the Artwork doc, notify" sequence can't drift between the two paths -
// the only difference between a fresh generation and a regeneration is
// whether `variationOf` is set.
const generateAndSaveArtwork = async ({ user, memory, style, variationOf }) => {
  const generated = await aiServiceClient.generateArtwork({
    description: memory.description,
    style,
    emotion: memory.aiAnalysis?.emotion,
    location: memory.location,
    title: memory.title,
  });

  const artwork = await Artwork.create({
    user: user._id,
    memory: memory._id,
    style,
    imageUrl: generated.image_url,
    thumbnailUrl: generated.thumbnail_url,
    title: memory.aiAnalysis?.suggestedTitles?.[0] || memory.title,
    storyText: memory.aiAnalysis?.story,
    variationOf,
    generationMeta: {
      provider: 'grok',
      model: generated.model,
      prompt: generated.prompt_used,
    },
  });

  try {
    await notify({
      userId: user._id,
      type: 'artwork_ready',
      message: `Your ${style.replace('_', ' ')} piece from "${memory.title || 'a memory'}" is ready.`,
      link: `/memories/${memory._id}`,
    });
  } catch (error) {
    console.error('Failed to create artwork_ready notification:', error.message);
  }

  return artwork;
};

// @desc    Generate a new AI artwork for one of the user's memories
// @route   POST /api/artworks
// @access  Private
// body: { memoryId, style }
const createArtwork = asyncHandler(async (req, res) => {
  const { memoryId, style } = req.body;

  if (!memoryId || !style) {
    res.status(400);
    throw new Error('memoryId and style are required');
  }

  if (!ART_STYLES.includes(style)) {
    res.status(400);
    throw new Error(`style must be one of: ${ART_STYLES.join(', ')}`);
  }

  const memory = await Memory.findOne({ _id: memoryId, user: req.user._id });
  if (!memory) {
    res.status(404);
    throw new Error('Memory not found');
  }

  let artwork;
  try {
    artwork = await generateAndSaveArtwork({ user: req.user, memory, style });
  } catch (error) {
    res.status(502);
    throw new Error(`Artwork generation failed: ${error.response?.data?.detail || error.message}`);
  }

  res.status(201).json({ success: true, data: artwork });
});

// @desc    Generate another take on an existing artwork - same memory and
//          style, added to that piece's variation set
// @route   POST /api/artworks/:id/regenerate
// @access  Private
const regenerateArtwork = asyncHandler(async (req, res) => {
  const source = await Artwork.findOne({ _id: req.params.id, user: req.user._id });
  if (!source) {
    res.status(404);
    throw new Error('Artwork not found');
  }

  const memory = await Memory.findOne({ _id: source.memory, user: req.user._id });
  if (!memory) {
    res.status(404);
    throw new Error('The memory this artwork belongs to was not found');
  }

  // Always point at the true root, even if regenerating a regeneration -
  // keeps the whole variation set groupable with a single query.
  const rootId = source.variationOf || source._id;

  let artwork;
  try {
    artwork = await generateAndSaveArtwork({ user: req.user, memory, style: source.style, variationOf: rootId });
  } catch (error) {
    res.status(502);
    throw new Error(`Regeneration failed: ${error.response?.data?.detail || error.message}`);
  }

  res.status(201).json({ success: true, data: artwork });
});

// @desc    List the logged-in user's artworks (optionally filter by memory or favorite)
// @route   GET /api/artworks
// @access  Private
const getArtworks = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.memoryId) filter.memory = req.query.memoryId;
  if (req.query.favorite !== undefined) filter.isFavorite = req.query.favorite === 'true';

  const artworks = await Artwork.find(filter).populate('memory', 'title').sort({ createdAt: -1 });
  res.json({ success: true, count: artworks.length, data: artworks });
});

// @desc    Get a single artwork
// @route   GET /api/artworks/:id
// @access  Private
const getArtwork = asyncHandler(async (req, res) => {
  const artwork = await Artwork.findOne({ _id: req.params.id, user: req.user._id });
  if (!artwork) {
    res.status(404);
    throw new Error('Artwork not found');
  }
  res.json({ success: true, data: artwork });
});

// @desc    Toggle favorite on an artwork
// @route   PUT /api/artworks/:id/favorite
// @access  Private
const toggleFavorite = asyncHandler(async (req, res) => {
  const artwork = await Artwork.findOne({ _id: req.params.id, user: req.user._id });
  if (!artwork) {
    res.status(404);
    throw new Error('Artwork not found');
  }
  artwork.isFavorite = !artwork.isFavorite;
  const updated = await artwork.save();
  res.json({ success: true, data: updated });
});

// @desc    Delete an artwork
// @route   DELETE /api/artworks/:id
// @access  Private
const deleteArtwork = asyncHandler(async (req, res) => {
  const artwork = await Artwork.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!artwork) {
    res.status(404);
    throw new Error('Artwork not found');
  }
  res.json({ success: true, data: {} });
});

module.exports = {
  createArtwork,
  regenerateArtwork,
  getArtworks,
  getArtwork,
  toggleFavorite,
  deleteArtwork,
};
