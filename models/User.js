// =============================================================================
// models/User.js — User Schema (Consumer, Meter Reader, Admin)
// =============================================================================
// Defines the User model with role-based fields. Passwords are hashed using
// bcryptjs before saving. The 'consumerId' field is only relevant for consumers.
// =============================================================================

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    // Full name of the user
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },

    // Email — used as login credential, must be unique
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },

    // Hashed password — never stored in plain text
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },

    // Role determines access level throughout the application
    role: {
      type: String,
      enum: ['consumer', 'meter_reader', 'admin'],
      default: 'consumer',
    },

    // Unique consumer ID assigned by admin (only for consumers)
    consumerId: {
      type: String,
      unique: true,
      sparse: true, // Allows null for non-consumer roles
    },

    // Type of electricity connection
    connectionType: {
      type: String,
      enum: ['domestic', 'commercial', 'industrial'],
      default: 'domestic',
    },

    // Reference to the tariff slab assigned to this consumer
    tariffSlab: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TariffSlab',
    },

    // Consumer address
    address: {
      type: String,
      trim: true,
    },

    // Contact phone number
    phone: {
      type: String,
      trim: true,
    },
  },
  {
    // Automatically add createdAt and updatedAt timestamps
    timestamps: true,
  }
);

// =============================================================================
// Pre-save Hook: Hash password before saving to database
// =============================================================================
userSchema.pre('save', async function () {
  // Only hash if the password field has been modified (or is new)
  if (!this.isModified('password')) return;

  // Generate salt with 12 rounds and hash the password
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// =============================================================================
// Instance Method: Compare entered password with hashed password
// =============================================================================
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
