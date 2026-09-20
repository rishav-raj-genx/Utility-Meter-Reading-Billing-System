// =============================================================================
// config/db.js — MongoDB Atlas Connection Helper
// =============================================================================
// Establishes and exports the Mongoose connection to MongoDB Atlas.
// Uses the MONGODB_URI from environment variables.
// =============================================================================

import mongoose from 'mongoose';

/**
 * connectDB - Connects to MongoDB Atlas using Mongoose.
 * Logs success/failure and exits process on fatal connection error.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
