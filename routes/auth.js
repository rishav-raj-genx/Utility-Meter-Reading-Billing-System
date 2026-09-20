// =============================================================================
// routes/auth.js — Authentication Routes
// =============================================================================
// Defines routes for user registration, login, and logout.
// These routes are publicly accessible (no auth middleware).
// =============================================================================

import { Router } from 'express';
import * as authController from '../controllers/authController.js';

const router = Router();

// GET /auth/register — Display registration form
router.get('/register', authController.renderRegister);

// POST /auth/register — Process registration
router.post('/register', authController.register);

// GET /auth/login — Display login form
router.get('/login', authController.renderLogin);

// POST /auth/login — Process login
router.post('/login', authController.login);

// GET /auth/logout — Destroy session and redirect
router.get('/logout', authController.logout);

export default router;
