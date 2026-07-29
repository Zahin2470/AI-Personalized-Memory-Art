const asyncHandler = require('express-async-handler');
const Memory = require('../models/Memory');
const Contribution = require('../models/Contribution');
const { storeFile } = require('../services/fileStorage');
const { notify } = require('../services/notify');

// @desc    Look up a memory by its invite token (minimal info only - this is
//          a public, unauthenticated route reachable by anyone with the link)
// @route   GET /api/contribute/:token
// @access  Public
const getInviteInfo = asyncHandler(async (req, res) => {
  const memory = await Memory.findOne({ inviteToken: req.params.token });
  if (!memory) {
    res.status(404);
    throw new Error('This invite link isn\u2019t valid - it may have been reset by the owner');
  }

  res.json({ success: true, data: { title: memory.title || 'A memory' } });
});

// @desc    Add a photo/message to a memory via its invite link
// @route   POST /api/contribute/:token
// @access  Public
// body: { contributorName, text? }, optional file field `photo`
const addContribution = asyncHandler(async (req, res) => {
  const memory = await Memory.findOne({ inviteToken: req.params.token });
  if (!memory) {
    res.status(404);
    throw new Error('This invite link isn\u2019t valid - it may have been reset by the owner');
  }

  const { contributorName, text } = req.body;
  if (!contributorName?.trim()) {
    res.status(400);
    throw new Error('Your name is required so the memory\u2019s owner knows who this is from');
  }
  if (!text?.trim() && !req.file) {
    res.status(400);
    throw new Error('Add a message or a photo (or both)');
  }

  const photo = req.file ? await storeFile(req.file, { folder: 'memory-art/uploads/contributions' }) : undefined;

  const contribution = await Contribution.create({
    memory: memory._id,
    contributorName: contributorName.trim(),
    text: text?.trim(),
    photo,
  });

  try {
    await notify({
      userId: memory.user,
      type: 'contribution_received',
      message: `${contributorName.trim()} added to "${memory.title || 'a memory'}".`,
      link: `/memories/${memory._id}`,
    });
  } catch (error) {
    console.error('Failed to create contribution_received notification:', error.message);
  }

  res.status(201).json({ success: true, data: contribution });
});

module.exports = { getInviteInfo, addContribution };
