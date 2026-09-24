require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const { registerSocketServer } = require('./socket');
const { corsOptions, allowedOrigins } = require('./corsConfig');


const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.PORT || 5000);

app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use((req, _res, next) => {
  const bearerToken = req.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (bearerToken) req.cookies.token = bearerToken;
  next();
});
const adminRoutes = require('./routes/admin');
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
app.use('/api/admin', adminRoutes);

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
  allowedOrigins: [...allowedOrigins],
});

server.listen(PORT, () => console.log(`API server listening on http://localhost:${PORT}`));
