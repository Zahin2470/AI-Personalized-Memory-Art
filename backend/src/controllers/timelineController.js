const asyncHandler = require('express-async-handler');
const Memory = require('../models/Memory');
const aiServiceClient = require('../services/aiServiceClient');

// @desc    Build a chronological narrative across all of the user's dated memories
// @route   GET /api/timeline
// @access  Private
const getTimeline = asyncHandler(async (req, res) => {
  const memories = await Memory.find({
    user: req.user._id,
    'dates.0': { $exists: true },
  }).sort({ createdAt: 1 });

  if (memories.length === 0) {
    return res.json({ success: true, data: { narrative: '', entries: [] } });
  }

  const entries = memories.flatMap((m) =>
    m.dates.map((d) => ({
      label: d.label || m.title || m.description.slice(0, 40),
      date: d.date ? d.date.toISOString().slice(0, 10) : null,
      description: m.description,
      memoryId: m._id.toString(),
      photoUrl: m.photos?.[0]?.url,
    }))
  );

  let result;
  try {
    result = await aiServiceClient.buildTimeline(entries);
  } catch (error) {
    res.status(502);
    throw new Error(`Timeline generation failed: ${error.response?.data?.detail || error.message}`);
  }

  // The AI service only echoes back {label, date, description} - reattach
  // our memoryId/photoUrl so the frontend can link each entry to its memory.
  const merged = result.ordered_entries.map((oe) => {
    const match = entries.find((e) => e.label === oe.label && e.date === oe.date) || {};
    return { ...oe, memoryId: match.memoryId, photoUrl: match.photoUrl };
  });

  res.json({ success: true, data: { narrative: result.narrative, entries: merged } });
});

module.exports = { getTimeline };
