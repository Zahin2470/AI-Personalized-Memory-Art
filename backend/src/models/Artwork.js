const mongoose = require('mongoose');

const ART_STYLES = [
  'watercolor',
  'minimalist',
  'oil_painting',
  'pencil_sketch',
  'vintage_poster',
  'pop_art',
  'abstract_collage',
];

const artworkSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    memory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Memory',
      required: true,
      index: true,
    },
    style: {
      type: String,
      enum: ART_STYLES,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    thumbnailUrl: {
      type: String,
    },
    title: {
      type: String,
      trim: true,
    },
    storyText: {
      type: String,
      trim: true,
    },
    // Prompt sent to the generation model, kept for regeneration / auditing.
    generationMeta: {
      provider: { type: String, default: 'grok' },
      model: { type: String },
      prompt: { type: String },
      seed: { type: String },
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    // Set when this artwork is a "try another take" of an earlier one.
    // Always points to the ORIGINAL root artwork (not necessarily the
    // immediate previous attempt) - regenerating a regeneration still
    // points here, so grouping a whole variation set is one query
    // (find where _id == root OR variationOf == root) instead of walking
    // a chain.
    variationOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artwork',
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Artwork', artworkSchema);
module.exports.ART_STYLES = ART_STYLES;
