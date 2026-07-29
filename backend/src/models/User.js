const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { isAdminEmail } = require('../utils/adminEmails');

const addressSchema = new mongoose.Schema(
  {
    line1: { type: String, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    country: { type: String, trim: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false, // never return password by default
    },
    // Optional - only needed at checkout time for physical products.
    // Not required at signup so users can sign up with just name + email + password.
    address: {
      type: addressSchema,
      required: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    // How this account authenticates. Google-created accounts still get a
    // (random, unusable-by-them) password so the `password` field's
    // `required: true` above doesn't need special-casing elsewhere.
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    googleId: {
      type: String,
      index: true,
      sparse: true, // only Google-linked accounts have this, so it can't collide on null
    },
    // Password reset (forgot-password flow). Only a SHA-256 hash of the
    // reset token is ever stored - the raw token goes out in the email link
    // and is never persisted, same principle as never storing plaintext
    // passwords: a DB leak alone shouldn't be enough to reset an account.
    passwordResetTokenHash: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Auto-promote to admin if this email is in ADMIN_EMAILS - runs on every
// save, not just creation, so adding someone to the list after they already
// have an account promotes them the next time anything touches their doc
// (login already does an explicit check + save for this too, see
// authController.loginUser).
userSchema.pre('save', function autoPromoteAdmin(next) {
  if (this.role !== 'admin' && isAdminEmail(this.email)) {
    this.role = 'admin';
  }
  next();
});

// Instance method to compare passwords
userSchema.methods.matchPassword = async function matchPassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Generates a password-reset token: returns the RAW token (to email to the
// user) while storing only its hash + a 30-minute expiry on the document.
// Caller is responsible for calling `.save()` afterward.
userSchema.methods.createPasswordResetToken = function createPasswordResetToken() {
  const rawToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  this.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  return rawToken;
};

module.exports = mongoose.model('User', userSchema);
