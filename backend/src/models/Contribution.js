const mongoose = require('mongoose');

const contributionSchema = new mongoose.Schema(
  {
    memory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Memory',
      required: true,
      index: true,
    },
    contributorName: {
      type: String,
      required: [true, 'A name is required so the memory\u2019s owner knows who this is from'],
      trim: true,
      maxlength: 80,
    },
    text: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    photo: {
      url: { type: String },
      publicId: { type: String },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Contribution', contributionSchema);
