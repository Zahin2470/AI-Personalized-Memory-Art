const mongoose = require('mongoose');

const memorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      // If left blank, the AI service (Part 2) fills this in with a suggested title.
    },
    description: {
      type: String,
      required: [true, 'A short description of the memory is required'],
      trim: true,
      maxlength: 2000,
    },
    photos: [
      {
        url: { type: String, required: true },
        publicId: { type: String }, // storage provider reference (e.g. Cloudinary)
      },
    ],
    voiceNote: {
      url: { type: String },
      publicId: { type: String },
      transcript: { type: String }, // filled in by AI service after transcription
    },
    dates: [
      {
        label: { type: String, trim: true }, // e.g. "First Trip"
        date: { type: Date, required: true },
      },
    ],
    location: {
      type: String,
      trim: true,
    },
    // Filled in by the AI service (Part 2) - not set by the user directly.
    aiAnalysis: {
      emotion: { type: String }, // e.g. joy, nostalgia, celebration, peace
      colorPalette: [{ type: String }], // hex codes
      suggestedTitles: [{ type: String }],
      story: { type: String },
      tags: [{ type: String }],
    },
    status: {
      type: String,
      enum: ['draft', 'analyzed', 'archived'],
      default: 'draft',
    },
    // Memory Capsule (Part 5): when set to a future date, the memory's
    // content is hidden - even from its owner - until that date passes.
    // Lets someone seal a memory to be opened on a future anniversary, etc.
    capsule: {
      revealAt: { type: Date },
    },
    // Collaborative Memories (Part 5): a random token that lets anyone with
    // the link contribute a photo/message to this memory without an
    // account. Generated on demand via POST /api/memories/:id/invite.
    inviteToken: {
      type: String,
      index: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

memorySchema.index({ user: 1, createdAt: -1 });

// True while the memory is sealed and its reveal date hasn't arrived yet.
memorySchema.methods.isSealed = function isSealed() {
  return Boolean(this.capsule?.revealAt && this.capsule.revealAt > new Date());
};

module.exports = mongoose.model('Memory', memorySchema);
