// =============================================================================
// routes/admin.js — Admin Routes
// =============================================================================
// All routes are protected by isAuthenticated + authorizeRoles('admin').
// Provides CRUD operations for consumers, meters, and tariff slabs,
// plus the admin analytics dashboard.
// =============================================================================

import { Router } from 'express';
import { isAuthenticated, authorizeRoles } from '../middleware/auth.js';
import * as adminController from '../controllers/adminController.js';

const router = Router();

// Apply auth middleware to all admin routes
router.use(isAuthenticated, authorizeRoles('admin'));

// -------------------------------------------------------------------------
// Dashboard
// -------------------------------------------------------------------------
router.get('/dashboard', adminController.dashboard);

// -------------------------------------------------------------------------
// Consumer Management
// -------------------------------------------------------------------------
router.get('/consumers', adminController.listConsumers);
router.post('/consumers', adminController.createConsumer);
router.post('/consumers/:id/update', adminController.updateConsumer);
router.post('/consumers/:id/delete', adminController.deleteConsumer);

// -------------------------------------------------------------------------
// Meter Management
// -------------------------------------------------------------------------
router.get('/meters', adminController.listMeters);
router.post('/meters', adminController.createMeter);
router.post('/meters/:id/delete', adminController.deleteMeter);

// -------------------------------------------------------------------------
// Tariff Slab Management
// -------------------------------------------------------------------------
router.get('/tariffs', adminController.listTariffs);
router.post('/tariffs', adminController.createTariff);
router.post('/tariffs/:id/delete', adminController.deleteTariff);

// -------------------------------------------------------------------------
// Meter Reader Management
// -------------------------------------------------------------------------
router.get('/readers', adminController.listReaders);
router.post('/readers', adminController.createReader);
router.post('/readers/:id/delete', adminController.deleteReader);

export default router;
