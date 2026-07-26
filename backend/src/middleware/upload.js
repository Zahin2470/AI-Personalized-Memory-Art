const multer = require('multer');
const path = require('path');

const ALLOWED_EXT = /jpeg|jpg|png|webp|mp3|wav|m4a/;

const fileFilter = (req, file, cb) => {
  const extOk = ALLOWED_EXT.test(path.extname(file.originalname).toLowerCase());
  if (extOk) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Use JPG/PNG/WEBP for photos or MP3/WAV/M4A for voice notes.'));
  }
};

// Files land in memory as a Buffer (req.files[...].buffer). The controller
// hands each buffer to src/services/fileStorage.js, which uploads it to
// Cloudinary when configured, or writes it to local disk otherwise. Keeping
// storage decisions out of multer keeps this middleware simple and avoids
// pulling in third-party multer-storage-* packages (one we tried,
// multer-storage-cloudinary, forces an old vulnerable cloudinary version).
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB per file
});

module.exports = upload;
