require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const connectDB = require('./src/config/db');
const { notFound, errorHandler } = require('./src/middleware/errorHandler');
const authRoutes = require('./src/routes/authRoutes');
const memoryRoutes = require('./src/routes/memoryRoutes');
const artworkRoutes = require('./src/routes/artworkRoutes');
const timelineRoutes = require('./src/routes/timelineRoutes');
const productRoutes = require('./src/routes/productRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const contributeRoutes = require('./src/routes/contributeRoutes');
const { handleStripeWebhook } = require('./src/controllers/webhookController');

const app = express();

// Ensure local uploads folder exists (dev only - see middleware/upload.js)
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));

// Stripe webhook needs the raw request body for signature verification, so
// it's mounted here - BEFORE express.json() - and is the one route in this
// app that isn't JSON-parsed.
app.post('/api/orders/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));
app.use('/uploads', express.static(uploadsDir));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Memory Art API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/memories', memoryRoutes);
app.use('/api/artworks', artworkRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/contribute', contributeRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

// Only auto-start when run directly (keeps this requireable in tests later)
if (require.main === module) {
  start();
}

module.exports = app;
