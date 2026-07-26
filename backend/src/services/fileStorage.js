const fs = require('fs');
const path = require('path');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');

const LOCAL_UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

const uploadBufferToCloudinary = (buffer, folder, resourceType) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });

const saveLocally = async (file) => {
  if (!fs.existsSync(LOCAL_UPLOADS_DIR)) {
    fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
  }
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const filename = `${uniqueSuffix}${path.extname(file.originalname)}`;
  await fs.promises.writeFile(path.join(LOCAL_UPLOADS_DIR, filename), file.buffer);
  return { url: `/uploads/${filename}` };
};

/**
 * Stores one multer file (in-memory buffer) and returns { url, publicId? }.
 * Uses Cloudinary when configured (required for the AI service to be able
 * to fetch the image - it needs a public URL), otherwise falls back to
 * local disk for quick dev without a Cloudinary account.
 */
const storeFile = async (file, { folder = 'memory-art/uploads' } = {}) => {
  if (!file) return null;

  if (!isCloudinaryConfigured()) {
    return saveLocally(file);
  }

  const isAudio = /^audio\//.test(file.mimetype);
  const result = await uploadBufferToCloudinary(file.buffer, folder, isAudio ? 'video' : 'image');
  // Cloudinary treats audio as resource_type "video" - this is expected, not a bug.

  return { url: result.secure_url, publicId: result.public_id };
};

module.exports = { storeFile };
