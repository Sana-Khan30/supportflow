require('dotenv').config();
const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
const { initSocket } = require('./src/sockets');
const { apiLimiter, authLimiter } = require('./src/middleware/rateLimiter');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io real-time engine
initSocket(server);

// Middleware
// NOTE: browsers reject `credentials: true` combined with a wildcard '*' origin,
// so instead of falling back to '*' we reflect back any origin on an explicit
// allow-list. Set FRONTEND_URL in production to your deployed frontend URL;
// additional origins (e.g. previews) can be added via FRONTEND_URL as a
// comma-separated list.
const allowedOrigins = [
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map((o) => o.trim()) : []),
  'http://localhost:5173',
  'https://supportflow-gray.vercel.app',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (no Origin header, e.g. curl/Postman/health checks)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve local uploads folder if it exists
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection middleware
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ message: 'Database connection failed' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Apply rate limiting
app.use('/api/', apiLimiter);

// Mount API routes
app.use('/api/auth', authLimiter, require('./src/routes/authRoutes'));
app.use('/api/tickets', require('./src/routes/ticketRoutes'));
app.use('/api/messages', require('./src/routes/messageRoutes'));
app.use('/api/bookings', require('./src/routes/bookingRoutes'));
app.use('/api/analytics', require('./src/routes/analyticsRoutes'));
app.use('/api/notifications', require('./src/routes/notificationRoutes'));

// 404 handler for unknown API routes
app.use('/api/*splat', (req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  connectDB().then(() => {
    server.listen(PORT, () => {
      console.log(`Server & Socket.IO running on port ${PORT}`);
    });
  });
}

// Attach server instance for programmatic access
app.server = server;

module.exports = app;