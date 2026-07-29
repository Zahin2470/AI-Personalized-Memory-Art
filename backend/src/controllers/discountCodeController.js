const asyncHandler = require('express-async-handler');
const DiscountCode = require('../models/DiscountCode');

// @desc    Check a code and preview its discount, without consuming a use
// @route   POST /api/discount-codes/validate
// @access  Private
// body: { code, subtotalCents }
const validateCode = asyncHandler(async (req, res) => {
  const { code, subtotalCents } = req.body;

  if (!code || subtotalCents == null) {
    res.status(400);
    throw new Error('code and subtotalCents are required');
  }

  const discount = await DiscountCode.findOne({ code: code.trim().toUpperCase() });

  if (!discount || !discount.isValid()) {
    res.status(404);
    throw new Error('That code isn\u2019t valid or has expired');
  }

  const discountCents = discount.computeDiscount(subtotalCents);

  res.json({
    success: true,
    data: {
      code: discount.code,
      type: discount.type,
      value: discount.value,
      discountCents,
    },
  });
});

// @desc    Create a discount code
// @route   POST /api/admin/discount-codes
// @access  Private/Admin
const createCode = asyncHandler(async (req, res) => {
  const { code, type, value, maxUses, expiresAt } = req.body;

  if (!code || !type || value == null) {
    res.status(400);
    throw new Error('code, type, and value are required');
  }
  if (!['percent', 'fixed'].includes(type)) {
    res.status(400);
    throw new Error('type must be "percent" or "fixed"');
  }

  const exists = await DiscountCode.findOne({ code: code.trim().toUpperCase() });
  if (exists) {
    res.status(400);
    throw new Error('A code with that name already exists');
  }

  const discount = await DiscountCode.create({
    code: code.trim(),
    type,
    value,
    maxUses: maxUses || undefined,
    expiresAt: expiresAt || undefined,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, data: discount });
});

// @desc    List all discount codes
// @route   GET /api/admin/discount-codes
// @access  Private/Admin
const getCodes = asyncHandler(async (req, res) => {
  const codes = await DiscountCode.find().sort({ createdAt: -1 });
  res.json({ success: true, count: codes.length, data: codes });
});

// @desc    Toggle a code active/inactive
// @route   PUT /api/admin/discount-codes/:id
// @access  Private/Admin
const updateCode = asyncHandler(async (req, res) => {
  const discount = await DiscountCode.findById(req.params.id);
  if (!discount) {
    res.status(404);
    throw new Error('Discount code not found');
  }

  if (req.body.active !== undefined) discount.active = req.body.active;
  if (req.body.expiresAt !== undefined) discount.expiresAt = req.body.expiresAt || undefined;
  if (req.body.maxUses !== undefined) discount.maxUses = req.body.maxUses || undefined;

  const updated = await discount.save();
  res.json({ success: true, data: updated });
});

// @desc    Delete a discount code
// @route   DELETE /api/admin/discount-codes/:id
// @access  Private/Admin
const deleteCode = asyncHandler(async (req, res) => {
  const discount = await DiscountCode.findByIdAndDelete(req.params.id);
  if (!discount) {
    res.status(404);
    throw new Error('Discount code not found');
  }
  res.json({ success: true, data: {} });
});

module.exports = { validateCode, createCode, getCodes, updateCode, deleteCode };
