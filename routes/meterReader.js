// =============================================================================
// routes/meterReader.js — Meter Reader Routes
// =============================================================================
// Protected by isAuthenticated + authorizeRoles('meter_reader').
// Provides routes for listing meters and entering monthly readings.
// =============================================================================

import { Router } from 'express';
import { isAuthenticated, authorizeRoles } from '../middleware/auth.js';
import * as meterReaderController from '../controllers/meterReaderController.js';

const router = Router();

// Apply auth middleware to all meter reader routes
router.use(isAuthenticated, authorizeRoles('meter_reader'));

// GET /meter-reader/meters — List all active meters
router.get('/meters', meterReaderController.listMeters);

// GET /meter-reader/meters/:id/reading — Show reading entry form
router.get('/meters/:id/reading', meterReaderController.renderEnterReading);

// POST /meter-reader/meters/:id/reading — Submit a new reading
router.post('/meters/:id/reading', meterReaderController.submitReading);

export default router;
