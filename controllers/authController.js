// =============================================================================
// controllers/authController.js — Authentication Controller
// =============================================================================
// Handles user registration, login, and logout. Passwords are hashed via the
// User model's pre-save hook. Sessions are managed with express-session.
// =============================================================================

import User from '../models/User.js';

/**
 * renderRegister — Display the registration form.
 */
export const renderRegister = (req, res) => {
  res.render('auth/register', { title: 'Register' });
};

/**
 * register — Process registration form submission.
 * Creates a new user with the provided details and redirects to login.
 */
export const register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, role } = req.body;

    // Validate password confirmation
    if (password !== confirmPassword) {
      req.flash('error', 'Passwords do not match.');
      return res.redirect('/auth/register');
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash('error', 'An account with this email already exists.');
      return res.redirect('/auth/register');
    }

    // Create new user (password is auto-hashed by pre-save hook)
    await User.create({
      name,
      email,
      password,
      role: role || 'consumer',
    });

    req.flash('success', 'Registration successful! Please log in.');
    return res.redirect('/auth/login');
  } catch (error) {
    console.error('Registration error:', error);
    req.flash('error', 'Registration failed. Please try again.');
    return res.redirect('/auth/register');
  }
};

/**
 * renderLogin — Display the login form.
 */
export const renderLogin = (req, res) => {
  res.render('auth/login', { title: 'Login' });
};

/**
 * login — Process login form submission.
 * Verifies credentials and creates a session on success.
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      console.log(`Login failed: User not found for email: ${normalizedEmail}`);
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/auth/login');
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log(`Login failed: Invalid password for user: ${normalizedEmail}`);
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/auth/login');
    }

    // Create session — store userId and role
    req.session.userId = user._id;
    req.session.userRole = user.role;

    req.flash('success', `Welcome back, ${user.name}!`);

    // Redirect based on role
    switch (user.role) {
      case 'admin':
        return res.redirect('/admin/dashboard');
      case 'meter_reader':
        return res.redirect('/meter-reader/meters');
      case 'consumer':
        return res.redirect('/consumer/dashboard');
      default:
        return res.redirect('/');
    }
  } catch (error) {
    console.error('Login error:', error);
    req.flash('error', 'Login failed. Please try again.');
    return res.redirect('/auth/login');
  }
};

/**
 * logout — Destroy the current session and redirect to home.
 */
export const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/');
  });
};
