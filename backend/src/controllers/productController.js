const asyncHandler = require('express-async-handler');
const Artwork = require('../models/Artwork');
const Product = require('../models/Product');
const { CATALOG } = require('../config/catalog');

// @desc    Create a product from one of the user's artworks (adds to cart)
// @route   POST /api/products
// @access  Private
// body: { artworkId, type, size? }
const createProduct = asyncHandler(async (req, res) => {
  const { artworkId, type, size } = req.body;

  if (!artworkId || !type) {
    res.status(400);
    throw new Error('artworkId and type are required');
  }

  const catalogEntry = CATALOG[type];
  if (!catalogEntry) {
    res.status(400);
    throw new Error(`type must be one of: ${Object.keys(CATALOG).join(', ')}`);
  }

  const artwork = await Artwork.findOne({ _id: artworkId, user: req.user._id });
  if (!artwork) {
    res.status(404);
    throw new Error('Artwork not found');
  }

  const product = await Product.create({
    artwork: artwork._id,
    user: req.user._id,
    type,
    size,
    priceCents: catalogEntry.priceCents,
    previewUrl: artwork.imageUrl,
  });

  res.status(201).json({ success: true, data: product });
});

// @desc    List the user's cart (unordered products) or full product history
// @route   GET /api/products?ordered=false
// @access  Private
const getProducts = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.ordered !== undefined) {
    filter.ordered = req.query.ordered === 'true';
  }

  const products = await Product.find(filter).populate('artwork').sort({ createdAt: -1 });
  res.json({ success: true, count: products.length, data: products });
});

// @desc    Get a single product
// @route   GET /api/products/:id
// @access  Private
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, user: req.user._id }).populate('artwork');
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json({ success: true, data: product });
});

// @desc    Remove a product from the cart (only if not already ordered)
// @route   DELETE /api/products/:id
// @access  Private
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, user: req.user._id });
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  if (product.ordered) {
    res.status(400);
    throw new Error('Can\u2019t remove a product that\u2019s already part of an order');
  }
  await product.deleteOne();
  res.json({ success: true, data: {} });
});

module.exports = { createProduct, getProducts, getProduct, deleteProduct };
