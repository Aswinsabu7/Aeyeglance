'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars before anything else
dotenv.config({ path: path.join(__dirname, '.env') });

const { readJsonFile, writeJsonFile } = require('./utils/fileUtils');
const { isBcryptHash, hashPassword } = require('./utils/hashUtils');
const { errorHandler } = require('./middlewares/errorHandler.middleware');
const authRoutes      = require('./routes/auth.routes');
const ticketRoutes    = require('./routes/ticket.routes');
const aiRoutes        = require('./routes/ai.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const app = express();

// ─── Security Headers ─────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false // API server – no HTML content
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:4200',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again later.' }
});

app.use(globalLimiter);

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─── Request Logging ─────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Ticket Management API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',      authLimiter, authRoutes);
app.use('/api/tickets',   ticketRoutes);
app.use('/api/ai',        aiRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ─── 404 Catch-All ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Cannot ${req.method} ${req.url}` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Data Initialisation ─────────────────────────────────────────────────────
/**
 * On first boot, hash any plain-text passwords in users.json.
 */
async function initializeData() {
  const usersPath = path.join(__dirname, 'data', 'users.json');

  try {
    const users = await readJsonFile(usersPath);
    let updated = false;

    for (const user of users) {
      if (!isBcryptHash(user.password)) {
        user.password = await hashPassword(user.password);
        updated = true;
      }
    }

    if (updated) {
      await writeJsonFile(usersPath, users);
      console.log('✅  User passwords hashed on first boot');
    }
  } catch (err) {
    console.error('❌  Failed to initialise data:', err.message);
    process.exit(1);
  }
}

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT, 10) || 3000;

initializeData().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀  Server listening on http://localhost:${PORT}`);
    console.log(`🌍  Environment : ${process.env.NODE_ENV || 'development'}`);
  });
});

module.exports = app;
