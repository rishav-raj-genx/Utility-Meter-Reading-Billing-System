// =============================================================================
// models/Meter.js — Meter Schema
// =============================================================================
// Represents a physical electricity meter assigned to a consumer. Stores the
// meter number, consumer reference, installation date, status, last reading,
// and a full history of all readings taken by meter readers.
// =============================================================================

import mongoose from 'mongoose';

// Sub-schema for individual meter readings
const readingSchema = new mongoose.Schema(
  {
    // The meter reading value (in kWh)
    value: {
      type: Number,
      required: true,
    },

    // Date when the reading was taken
    date: {
      type: Date,
      default: Date.now,
    },

    // Reference to the meter reader who took this reading
    readBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { _id: true }
);

const meterSchema = new mongoose.Schema(
  {
    // Unique meter number (printed on physical meter)
    meterNumber: {
      type: String,
      required: [true, 'Meter number is required'],
      unique: true,
      trim: true,
    },

    // Consumer this meter is assigned to
    consumer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Consumer reference is required'],
    },

    // Date when the meter was installed
    installationDate: {
      type: Date,
      default: Date.now,
    },

    // Whether the meter is currently active or decommissioned
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },

    // The most recent reading value (cached for quick validation)
    lastReading: {
      type: Number,
      default: 0,
    },

    // Complete history of all readings taken on this meter
    readings: [readingSchema],
  },
  {
    timestamps: true,
  }
);

const Meter = mongoose.model('Meter', meterSchema);
export default Meter;
