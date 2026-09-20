// =============================================================================
// middleware/auth.js — Authentication & Authorization Middleware
// =============================================================================
// Provides three middleware functions:
// 1. isAuthenticated — blocks unauthenticated requests
// 2. authorizeRoles — restricts access to specific user roles
// 3. setLocals — injects current user data into EJS templates
// =============================================================================

import User from '../models/User.js';

/**
 * isAuthenticated — Checks if the user has an active session.
 * Redirects to login page if not authenticated.
 */
export const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  req.flash('error', 'Please log in to access this page.');
  return res.redirect('/auth/login');
};

/**
 * authorizeRoles — Role-based access control middleware factory.
 * Accepts one or more role strings and only allows matching users through.
 *
 * @param  {...string} roles - Allowed roles (e.g., 'admin', 'meter_reader')
 * @returns {Function} Express middleware
 *
 * Usage: router.get('/admin', authorizeRoles('admin'), controller)
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      req.flash('error', 'You do not have permission to access this page.');
      return res.redirect('/');
    }
    return next();
  };
};

/**
 * setLocals — Loads the current user from DB on every request and
 * makes it available as req.user and res.locals.currentUser for EJS templates.
 * Also passes flash messages to all views.
 */
export const setLocals = async (req, res, next) => {
  try {
    // Load user from session if logged in
    if (req.session && req.session.userId) {
      const user = await User.findById(req.session.userId).lean();
      req.user = user;
      res.locals.currentUser = user;
    } else {
      req.user = null;
      res.locals.currentUser = null;
    }

    // Make flash messages available to all EJS templates
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');

    next();
  } catch (error) {
    console.error('setLocals error:', error);
    next();
  }
};
