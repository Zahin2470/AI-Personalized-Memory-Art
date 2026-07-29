const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const Memory = require('../models/Memory');
const Contribution = require('../models/Contribution');
const { storeFile } = require('../services/fileStorage');
const aiServiceClient = require('../services/aiServiceClient');

// A sealed memory's content is hidden - even from its owner - until the
// reveal date passes. Used by every read path below so a capsule can't be
// peeked at through a different endpoint.
const maskIfSealed = (memoryDoc) => {
  const memory = memoryDoc.toObject ? memoryDoc.toObject() : memoryDoc;
  if (!memoryDoc.isSealed || !memoryDoc.isSealed()) return memory;

  return {
    _id: memory._id,
    user: memory.user,
    title: memory.title,
    status: 'sealed',
    capsule: memory.capsule,
    createdAt: memory.createdAt,
    updatedAt: memory.updatedAt,
  };
};

// @desc    Create a new memory (photos/voice optional, description required)
// @route   POST /api/memories
// @access  Private
const createMemory = asyncHandler(async (req, res) => {
  const { title, description, dates, location } = req.body;

  if (!description) {
    res.status(400);
    throw new Error('A description of the memory is required');
  }

  const photoFiles = req.files?.photos || [];
  const photos = await Promise.all(
    photoFiles.map((f) => storeFile(f, { folder: 'memory-art/uploads/photos' }))
  );

  const voiceFile = req.files?.voiceNote?.[0];
  const voiceNote = voiceFile
    ? await storeFile(voiceFile, { folder: 'memory-art/uploads/voice' })
    : undefined;

  // `dates` arrives as a JSON string from multipart form-data
  let parsedDates = [];
  if (dates) {
    try {
      parsedDates = JSON.parse(dates);
    } catch {
      res.status(400);
      throw new Error('`dates` must be valid JSON, e.g. [{"label":"First Trip","date":"2019-05-01"}]');
    }
  }

  const memory = await Memory.create({
    user: req.user._id,
    title,
    description,
    photos,
    voiceNote,
    dates: parsedDates,
    location,
  });

  res.status(201).json({ success: true, data: memory });

  // NOTE: AI analysis (emotion detection, story generation, suggested titles)
  // is triggered separately via POST /api/memories/:id/analyze once the
  // AI service (Part 2, Grok-powered) is wired up.
});

// @desc    List the logged-in user's memories
// @route   GET /api/memories
// @access  Private
// @desc    List the logged-in user's memories, with optional search/filter
// @route   GET /api/memories?q=&emotion=&dateFrom=&dateTo=
// @access  Private
const getMemories = asyncHandler(async (req, res) => {
  const { q, emotion, dateFrom, dateTo } = req.query;
  const filter = { user: req.user._id };

  if (q) {
    const regex = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); // escape regex special chars in user input
    filter.$or = [{ title: regex }, { description: regex }];
  }
  if (emotion) {
    filter['aiAnalysis.emotion'] = emotion;
  }
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }

  const memories = await Memory.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, count: memories.length, data: memories.map(maskIfSealed) });
});

// @desc    Get a single memory (must belong to the requesting user)
// @route   GET /api/memories/:id
// @access  Private
const getMemory = asyncHandler(async (req, res) => {
  const memory = await Memory.findOne({ _id: req.params.id, user: req.user._id });

  if (!memory) {
    res.status(404);
    throw new Error('Memory not found');
  }

  res.json({ success: true, data: maskIfSealed(memory) });
});

// @desc    Seal a memory into a capsule until a future date
// @route   PUT /api/memories/:id/seal
// @access  Private
// body: { revealAt: ISO date string }
const sealMemory = asyncHandler(async (req, res) => {
  const { revealAt } = req.body;
  const revealDate = new Date(revealAt);

  if (!revealAt || Number.isNaN(revealDate.getTime()) || revealDate <= new Date()) {
    res.status(400);
    throw new Error('revealAt must be a valid date in the future');
  }

  const memory = await Memory.findOne({ _id: req.params.id, user: req.user._id });
  if (!memory) {
    res.status(404);
    throw new Error('Memory not found');
  }

  memory.capsule = { revealAt: revealDate };
  await memory.save();

  res.json({ success: true, data: maskIfSealed(memory) });
});

// @desc    Unseal a memory early
// @route   DELETE /api/memories/:id/seal
// @access  Private
const unsealMemory = asyncHandler(async (req, res) => {
  const memory = await Memory.findOne({ _id: req.params.id, user: req.user._id });
  if (!memory) {
    res.status(404);
    throw new Error('Memory not found');
  }

  memory.capsule = undefined;
  await memory.save();

  res.json({ success: true, data: memory });
});

// @desc    Generate (or regenerate) a shareable link that lets anyone
//          contribute a photo/message to this memory without an account
// @route   POST /api/memories/:id/invite
// @access  Private
const createInvite = asyncHandler(async (req, res) => {
  const memory = await Memory.findOne({ _id: req.params.id, user: req.user._id });
  if (!memory) {
    res.status(404);
    throw new Error('Memory not found');
  }

  memory.inviteToken = crypto.randomBytes(16).toString('hex');
  await memory.save();

  res.json({ success: true, data: { inviteToken: memory.inviteToken } });
});

// @desc    List contributions a memory has received
// @route   GET /api/memories/:id/contributions
// @access  Private
const getContributions = asyncHandler(async (req, res) => {
  const memory = await Memory.findOne({ _id: req.params.id, user: req.user._id });
  if (!memory) {
    res.status(404);
    throw new Error('Memory not found');
  }

  const contributions = await Contribution.find({ memory: memory._id }).sort({ createdAt: -1 });
  res.json({ success: true, count: contributions.length, data: contributions });
});

// @desc    Transcribe this memory's voice note via the AI service
// @route   POST /api/memories/:id/transcribe
// @access  Private
const transcribeMemory = asyncHandler(async (req, res) => {
  const memory = await Memory.findOne({ _id: req.params.id, user: req.user._id });
  if (!memory) {
    res.status(404);
    throw new Error('Memory not found');
  }

  if (!memory.voiceNote?.url) {
    res.status(400);
    throw new Error('This memory doesn\u2019t have a voice note');
  }
  if (!memory.voiceNote.url.startsWith('http')) {
    res.status(400);
    throw new Error('Voice note is stored locally, not at a public URL the AI service can reach - configure Cloudinary to enable transcription');
  }

  let result;
  try {
    result = await aiServiceClient.transcribeVoiceNote({ audioUrl: memory.voiceNote.url });
  } catch (error) {
    res.status(502);
    throw new Error(`Transcription failed: ${error.response?.data?.detail || error.message}`);
  }

  memory.voiceNote.transcript = result.text;
  await memory.save();

  res.json({ success: true, data: memory });
});

// @desc    Run AI analysis on a memory: emotion, color palette, story, titles, tags.
//          Folds in any collaborator contributions and the voice note
//          transcript, if present, so the result reflects everyone's input.
// @route   POST /api/memories/:id/analyze
// @access  Private
const analyzeMemory = asyncHandler(async (req, res) => {
  const memory = await Memory.findOne({ _id: req.params.id, user: req.user._id });

  if (!memory) {
    res.status(404);
    throw new Error('Memory not found');
  }

  const contributions = await Contribution.find({ memory: memory._id });

  let description = memory.description;
  if (memory.voiceNote?.transcript) {
    description += `\n\nFrom a voice note: ${memory.voiceNote.transcript}`;
  }
  contributions.forEach((c) => {
    if (c.text) description += `\n\n${c.contributorName} added: ${c.text}`;
  });

  const photoUrls = [
    ...memory.photos.map((p) => p.url),
    ...contributions.map((c) => c.photo?.url).filter(Boolean),
  ].filter((url) => url && url.startsWith('http')); // skip local /uploads paths - not reachable by the AI service

  let analysis;
  try {
    analysis = await aiServiceClient.analyzeMemory({
      description,
      photoUrls,
      location: memory.location,
      dates: memory.dates,
    });
  } catch (error) {
    res.status(502);
    throw new Error(
      `AI analysis failed: ${error.response?.data?.detail || error.message}`
    );
  }

  memory.aiAnalysis = {
    emotion: analysis.emotion,
    colorPalette: analysis.color_palette,
    suggestedTitles: analysis.suggested_titles,
    story: analysis.story,
    tags: analysis.tags,
  };
  memory.status = 'analyzed';

  const updated = await memory.save();
  res.json({ success: true, data: updated });
});

// @desc    Update a memory's editable fields
// @route   PUT /api/memories/:id
// @access  Private
const updateMemory = asyncHandler(async (req, res) => {
  const memory = await Memory.findOne({ _id: req.params.id, user: req.user._id });

  if (!memory) {
    res.status(404);
    throw new Error('Memory not found');
  }

  const { title, description, location } = req.body;
  if (title !== undefined) memory.title = title;
  if (description !== undefined) memory.description = description;
  if (location !== undefined) memory.location = location;

  const updated = await memory.save();
  res.json({ success: true, data: updated });
});

// @desc    Delete a memory
// @route   DELETE /api/memories/:id
// @access  Private
const deleteMemory = asyncHandler(async (req, res) => {
  const memory = await Memory.findOneAndDelete({ _id: req.params.id, user: req.user._id });

  if (!memory) {
    res.status(404);
    throw new Error('Memory not found');
  }

  res.json({ success: true, data: {} });
});

module.exports = {
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
};
