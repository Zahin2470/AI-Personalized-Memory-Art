const asyncHandler = require('express-async-handler');
const Memory = require('../models/Memory');
const Artwork = require('../models/Artwork');
const aiServiceClient = require('../services/aiServiceClient');

const { ART_STYLES } = Artwork;

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

  let generated;
  try {
    generated = await aiServiceClient.generateArtwork({
      description: memory.description,
      style,
      emotion: memory.aiAnalysis?.emotion,
      location: memory.location,
      title: memory.title,
    });
  } catch (error) {
    res.status(502);
    throw new Error(
      `Artwork generation failed: ${error.response?.data?.detail || error.message}`
    );
  }

  const artwork = await Artwork.create({
    user: req.user._id,
    memory: memory._id,
    style,
    imageUrl: generated.image_url,
    thumbnailUrl: generated.thumbnail_url,
    title: memory.aiAnalysis?.suggestedTitles?.[0] || memory.title,
    storyText: memory.aiAnalysis?.story,
    generationMeta: {
      provider: 'grok',
      model: generated.model,
      prompt: generated.prompt_used,
    },
  });

  res.status(201).json({ success: true, data: artwork });
});

// @desc    List the logged-in user's artworks (optionally filter by memory)
// @route   GET /api/artworks
// @access  Private
const getArtworks = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.memoryId) filter.memory = req.query.memoryId;

  const artworks = await Artwork.find(filter).sort({ createdAt: -1 });
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

module.exports = { createArtwork, getArtworks, getArtwork, toggleFavorite, deleteArtwork };
