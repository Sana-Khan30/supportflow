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

// Robust CORS configuration supporting all dev ports and deployed frontends
const allowedOrigins = [
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map((o) => o.trim()) : []),
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'https://supportflow-gray.vercel.app',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    // Dynamically permit any localhost or 127.0.0.1 port
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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

// Apply rate limiting (generous limits for development & hackathon demo)
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