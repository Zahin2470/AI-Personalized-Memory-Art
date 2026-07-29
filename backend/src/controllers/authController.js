const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const emailService = require('../services/emailService');
const googleAuth = require('../services/googleAuthClient');
const { isAdminEmail } = require('../utils/adminEmails');

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  authProvider: user.authProvider,
});

// @desc    Register a new user (name, email, password required; address optional)
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, address } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Name, email and password are required');
  }

  if (password.length < 8) {
    res.status(400);
    throw new Error('Password must be at least 8 characters');
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('An account with this email already exists');
  }

  const user = await User.create({ name, email, password, address });

  res.status(201).json({
    success: true,
    data: publicUser(user),
    token: generateToken(user._id),
  });
});

// @desc    Log in an existing user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (user.authProvider === 'google') {
    res.status(401);
    throw new Error('This account uses Google sign-in - use the "Continue with Google" button instead');
  }

  if (!(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (user.role !== 'admin' && isAdminEmail(user.email)) {
    user.role = 'admin';
    await user.save();
  }

  res.json({
    success: true,
    data: publicUser(user),
    token: generateToken(user._id),
  });
});

// @desc    Sign in (or sign up, on first use) with a Google ID token
// @route   POST /api/auth/google
// @access  Public
// body: { credential } - the ID token from Google Identity Services
const googleLogin = asyncHandler(async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    res.status(400);
    throw new Error('Missing Google credential');
  }

  let payload;
  try {
    payload = await googleAuth.verifyIdToken(credential);
  } catch (error) {
    res.status(401);
    throw new Error(`Google sign-in failed: ${error.message}`);
  }

  if (!payload?.email) {
    res.status(401);
    throw new Error('Google did not return an email address for this account');
  }

  let user = await User.findOne({ $or: [{ googleId: payload.sub }, { email: payload.email }] });

  if (user) {
    // A local account with this email exists - link it to Google rather
    // than creating a duplicate, so either sign-in method works from now on.
    if (!user.googleId) {
      user.googleId = payload.sub;
      user.authProvider = 'google';
      await user.save();
    }
  } else {
    user = await User.create({
      name: payload.name || payload.email.split('@')[0],
      email: payload.email,
      // Random, never shown to the user, never usable for local login -
      // this account only ever authenticates via Google. Exists purely to
      // satisfy the schema's required password field.
      password: crypto.randomBytes(32).toString('hex'),
      googleId: payload.sub,
      authProvider: 'google',
    });
  }

  res.json({
    success: true,
    data: publicUser(user),
    token: generateToken(user._id),
  });
});

// @desc    Request a password reset email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  // Always return the same message whether or not the account exists (and
  // regardless of whether the email actually sends) - this endpoint must
  // not be usable to check which emails have accounts here.
  const genericResponse = {
    success: true,
    message: 'If an account exists for that email, a reset link has been sent.',
  };

  const user = await User.findOne({ email });
  if (!user || user.authProvider === 'google') {
    return res.json(genericResponse);
  }

  const rawToken = user.createPasswordResetToken();
  await user.save();

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const resetUrl = `${clientUrl}/reset-password/${rawToken}`;

  try {
    await emailService.sendPasswordResetEmail(user.email, resetUrl);
  } catch (error) {
    // Don't leave a dangling valid token if the email never actually went out.
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    console.error('Failed to send password reset email:', error.message);
  }

  res.json(genericResponse);
});

// @desc    Complete a password reset with the token from the emailed link
// @route   POST /api/auth/reset-password
// @access  Public
// body: { token, password }
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    res.status(400);
    throw new Error('Token and a new password are required');
  }
  if (password.length < 8) {
    res.status(400);
    throw new Error('Password must be at least 8 characters');
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetTokenHash +passwordResetExpires');

  if (!user) {
    res.status(400);
    throw new Error('This reset link is invalid or has expired');
  }

  user.password = password; // pre-save hook hashes it
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.json({
    success: true,
    data: publicUser(user),
    token: generateToken(user._id), // log them straight in after a successful reset
  });
});

// @desc    Get the logged-in user's profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user });
});

// @desc    Update profile (e.g. add a shipping address before checkout)
// @route   PUT /api/auth/me
// @access  Private
const updateMe = asyncHandler(async (req, res) => {
  const { name, address } = req.body;

  if (name) req.user.name = name;
  if (address) req.user.address = address;

  const updated = await req.user.save();
  res.json({ success: true, data: updated });
});

module.exports = {
  registerUser,
  loginUser,
  googleLogin,
  forgotPassword,
  resetPassword,
  getMe,
  updateMe,
};
