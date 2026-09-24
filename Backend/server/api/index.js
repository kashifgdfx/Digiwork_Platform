require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('../db');
const { registerSocketServer } = require('../socket');
const { corsOptions, allowedOrigins } = require('../corsConfig');

connectDB().catch((err) => {
  console.error('MongoDB Error:', err);
});

const app = express();
const server = http.createServer(app);

app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use((req, _res, next) => {
  const bearerToken = req.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (bearerToken) req.cookies.token = bearerToken;
  next();
});

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
app.use('/api/reviews', require('../routes/reviewRoutes'));
app.use('/api/conversations', require('../routes/conversations'));
app.use('/api/messages', require('../routes/messages'));
app.use('/api/notifications', require('../routes/notificationRoutes'));
app.use('/api/gig-view', require('../routes/gigViewRoutes'));
app.use('/api/analytics', require('../routes/analyticsRoutes'));
app.use('/api/work', require('../routes/workRoutes'));
app.use('/api/seed', require('../routes/seedRoutes'));
app.use('/api/admin', require('../routes/admin'));

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
});

registerSocketServer(server, {
  allowedOrigins: [...allowedOrigins],
});

// Export the HTTP server so Vercel's WebSocket-capable Node runtime can handle
// Socket.IO upgrades as well as ordinary HTTP requests.
module.exports = server;
module.exports.app = app;
