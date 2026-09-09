require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('../db');

connectDB().catch((err) => {
  console.error('MongoDB Error:', err);
});

const app = express();

const allowedOrigins = new Set([
  process.env.CLIENT_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]);

const isLocalOrigin = (origin) =>
  /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin) || isLocalOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

app.get('/health', (_req, res) =>
  res.json({ success: true, service: 'fiverr-clone-api' })
);

app.use('/api/auth', require('../routes/authRoutes'));
app.use('/api/profile', require('../routes/profileRoutes'));
app.use('/api/dashboard', require('../routes/dashboardRoutes'));
app.use('/api/gigs', require('../routes/gigRoutes'));
app.use('/api/orders', require('../routes/orderRoutes'));
app.use('/api/conversations', require('../routes/conversations'));
app.use('/api/messages', require('../routes/messages'));
app.use('/api/seed', require('../routes/seedRoutes'));

module.exports = app;