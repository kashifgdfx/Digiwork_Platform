require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const { registerSocketServer } = require('./socket');

const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.PORT || 5000);

const allowedOrigins = new Set([
  process.env.CLIENT_URL || 'https://digiwork-platform.vercel.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]);

const isLocalOrigin = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin) || isLocalOrigin(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

app.get('/health', (_req, res) => res.json({ success: true, service: 'fiverr-clone-api' }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/gigs', require('./routes/gigRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/conversations', require('./routes/conversations'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/gig-view', require('./routes/gigViewRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/work', require('./routes/workRoutes'));
app.use('/api/seed', require('./routes/seedRoutes'));

// ✅ Sahi 4-parameter error handler middleware
app.use((err, req, res, next) => {
  console.error("❌ Express Global Error:", err);
  const statusCode = err.status || 500;
  res.status(statusCode).json({ 
    success: false, 
    error: err.message || 'Internal Server Error' 
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

server.listen(PORT, () => console.log(`API server listening on http://localhost:${PORT}`));