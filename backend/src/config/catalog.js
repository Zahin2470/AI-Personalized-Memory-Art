// Kept in sync by hand with frontend/src/lib/constants.js (PRODUCT_TYPES).
// A real production build would generate both from one source of truth -
// small enough here that duplication is simpler than a shared package.
const CATALOG = {
  digital_download: { label: 'Digital Download', priceCents: 1200 },
  framed_print: { label: 'Framed Print', priceCents: 6800 },
  canvas_print: { label: 'Canvas Print', priceCents: 5400 },
  photo_book: { label: 'Memory Book', priceCents: 4500 },
  mug: { label: 'Keepsake Mug', priceCents: 2200 },
  cushion: { label: 'Cushion', priceCents: 3800 },
};

const isPhysical = (type) => type !== 'digital_download';

module.exports = { CATALOG, isPhysical };
