// =============================================================================
// app.js — Main Application Entry Point
// =============================================================================
// Configures and starts the Express server with:
// - EJS view engine with partials layout system
// - Session-based authentication (stored in MongoDB via connect-mongo)
// - Flash messages for user feedback
// - Role-based route mounting
// - Late payment surcharge cron job
// =============================================================================

import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import flash from 'connect-flash';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/db.js';
import { setLocals } from './middleware/auth.js';
import { initSurchargeJob } from './utils/surchargeJob.js';

// Route imports
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import meterReaderRoutes from './routes/meterReader.js';
import consumerRoutes from './routes/consumer.js';

// =============================================================================
// __dirname workaround for ES Modules
// =============================================================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================================================================
// Initialize Express app
// =============================================================================
const app = express();
const PORT = process.env.PORT || 3000;

// =============================================================================
// View Engine: EJS
// =============================================================================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// =============================================================================
// Middleware
// =============================================================================

// Parse URL-encoded form data and JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// =============================================================================
// Session Configuration (stored in MongoDB for persistence)
// =============================================================================
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      touchAfter: 24 * 3600, // Lazy session update (once per day)
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      httpOnly: true,
    },
  })
);

// Flash messages (requires session middleware above)
app.use(flash());

// Set user data and flash messages on every request (for EJS templates)
app.use(setLocals);

// =============================================================================
// Routes
// =============================================================================

// Home page
app.get('/', (req, res) => {
  res.render('home', { title: 'Utility Meter Reading & Billing System' });
});

// Auth routes (register, login, logout)
app.use('/auth', authRoutes);

// Admin routes (dashboard, consumers, meters, tariffs)
app.use('/admin', adminRoutes);

// Meter Reader routes (list meters, enter readings)
app.use('/meter-reader', meterReaderRoutes);

// Consumer routes (dashboard, bills, payment)
app.use('/consumer', consumerRoutes);

// =============================================================================
// 404 Handler
// =============================================================================
app.use((req, res) => {
  res.status(404).render('home', {
    title: '404 — Page Not Found',
    error404: true,
  });
});

// =============================================================================
// Start Server
// =============================================================================
const startServer = async () => {
  // Connect to MongoDB Atlas
  await connectDB();

  // Initialize the late-payment surcharge cron job
  initSurchargeJob();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

startServer();
