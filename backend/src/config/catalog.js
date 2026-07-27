// Kept in sync by hand with frontend/src/lib/constants.js (PRODUCT_TYPES).
// A real production build would generate both from one source of truth -
// small enough here that duplication is simpler than a shared package.
//
// Prices are in paisa (BDT's 1/100 subunit, same idea as USD cents) - set
// as sensible BDT price points for the local market, not a currency
// conversion of the old USD prices.
const CATALOG = {
  digital_download: { label: 'Digital Download', priceCents: 10000 }, // ৳100
  framed_print: { label: 'Framed Print', priceCents: 35000 }, // ৳350
  canvas_print: { label: 'Canvas Print', priceCents: 28000 }, // ৳280
  photo_book: { label: 'Memory Book', priceCents: 22000 }, // ৳220
  mug: { label: 'Keepsake Mug', priceCents: 50000 }, // ৳500
  cushion: { label: 'Cushion', priceCents: 100000 }, // ৳1,000
};

const isPhysical = (type) => type !== 'digital_download';

module.exports = { CATALOG, isPhysical };
