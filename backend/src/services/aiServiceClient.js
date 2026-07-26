const axios = require('axios');

const aiService = axios.create({
  baseURL: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  timeout: 90_000, // image generation can be slow
});

/**
 * All three functions throw on failure - callers should let
 * express-async-handler / errorHandler surface the message, or catch and
 * translate it into a friendlier response.
 */

const analyzeMemory = async ({ description, photoUrls = [], location, dates = [] }) => {
  const { data } = await aiService.post('/analyze', {
    description,
    photo_urls: photoUrls,
    location,
    dates: dates.map((d) => ({ label: d.label, date: d.date })),
  });
  return data;
};

const generateArtwork = async ({ description, style, emotion, location, title }) => {
  const { data } = await aiService.post('/artwork/generate', {
    description,
    style,
    emotion,
    location,
    title,
  });
  return data;
};

const buildTimeline = async (entries) => {
  const { data } = await aiService.post('/timeline', {
    entries: entries.map((e) => ({ label: e.label, date: e.date, description: e.description })),
  });
  return data;
};

const transcribeVoiceNote = async ({ audioUrl, language = 'en' }) => {
  const { data } = await aiService.post('/transcribe', { audio_url: audioUrl, language });
  return data;
};

module.exports = { analyzeMemory, generateArtwork, buildTimeline, transcribeVoiceNote };
