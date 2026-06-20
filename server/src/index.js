// ─── Vee Learn API — Main Entry Point ───────────────────────
// Loads config, wires up Express + Socket.io, and starts the
// HTTP server with graceful shutdown handling.
// ─────────────────────────────────────────────────────────────

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server as SocketIO } from 'socket.io';

// Database
import { initializeDatabase } from './config/db.js';

// Services
import { initChatService } from './services/chatService.js';

// Routes
import authRoutes      from './routes/auth.js';
import userRoutes      from './routes/users.js';
import skillRoutes     from './routes/skills.js';
import matchRoutes     from './routes/match.js';
import sessionRoutes   from './routes/sessions.js';
import creditRoutes    from './routes/credits.js';
import reviewRoutes    from './routes/reviews.js';
import messageRoutes   from './routes/messages.js';
import analyticsRoutes from './routes/analytics.js';

// ─── App Setup ──────────────────────────────────────────────

const app  = express();
const PORT = parseInt(process.env.PORT, 10) || 5000;

// ── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// ── Health check ────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API Routes ──────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/users',     userRoutes);
app.use('/api/skills',    skillRoutes);
app.use('/api/match',     matchRoutes);
app.use('/api/sessions',  sessionRoutes);
app.use('/api/credits',   creditRoutes);
app.use('/api/reviews',   reviewRoutes);
app.use('/api/messages',  messageRoutes);
app.use('/api/analytics', analyticsRoutes);

// ── 404 fallback ────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// ── Global error handler ────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Server] Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error.',
  });
});

// ─── HTTP + Socket.io Server ────────────────────────────────

const httpServer = createServer(app);

const io = new SocketIO(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible to controllers
app.set('io', io);

// Initialise real-time chat handlers
initChatService(io);

// ─── Start ──────────────────────────────────────────────────

async function start() {
  try {
    // Bootstrap database schema & seed data
    await initializeDatabase();

    httpServer.listen(PORT, () => {
      console.log(`\n🚀  Vee Learn API running on http://localhost:${PORT}`);
      console.log(`📡  WebSocket server ready`);
      console.log(`🗄️   Database connected\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

// ─── Graceful Shutdown ──────────────────────────────────────

function shutdown(signal) {
  console.log(`\n${signal} received — shutting down gracefully…`);
  httpServer.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
  // Force-kill after 10 s if connections hang
  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10_000);
}

process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
