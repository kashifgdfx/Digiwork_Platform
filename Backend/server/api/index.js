require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('../db');
const { registerSocketServer } = require('../socket');

connectDB().catch((err) => {
  console.error('MongoDB Error:', err);
});

const app = express();
const server = http.createServer(app);

const allowedOrigins = new Set([
  process.env.CLIENT_URL || 'https://digiwork-platform.vercel.app',
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

app.get('/', (_req, res) =>
  res.json({
    success: true,
    service: 'fiverr-clone-api',
    health: '/health',
    api: '/api',
  })
);

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

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
});

registerSocketServer(server, {
  allowedOrigins: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.CLIENT_URL || 'https://digiwork-platform.vercel.app',
    'https://digiwork-platform.vercel.app',
  ],
});

module.exports = app;
module.exports.server = server;