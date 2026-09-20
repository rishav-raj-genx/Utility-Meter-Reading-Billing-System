// =============================================================================
// routes/consumer.js — Consumer Routes
// =============================================================================
// Protected by isAuthenticated + authorizeRoles('consumer').
// Provides routes for viewing dashboard, bill history, details, and payment.
// =============================================================================

import { Router } from 'express';
import { isAuthenticated, authorizeRoles } from '../middleware/auth.js';
import * as consumerController from '../controllers/consumerController.js';

const router = Router();

// Apply auth middleware to all consumer routes
router.use(isAuthenticated, authorizeRoles('consumer'));

// GET /consumer/dashboard — Consumer's main dashboard
router.get('/dashboard', consumerController.dashboard);

// GET /consumer/bills — Bill history list
router.get('/bills', consumerController.billHistory);

// GET /consumer/bills/:id — Detailed bill view
router.get('/bills/:id', consumerController.billDetail);

// POST /consumer/bills/:id/pay — Mark bill as paid
router.post('/bills/:id/pay', consumerController.payBill);

export default router;
