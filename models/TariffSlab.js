// =============================================================================
// models/TariffSlab.js — Tariff Slab Schema
// =============================================================================
// Defines tariff slabs that determine billing rates. Each slab has a connection
// type, an array of rate tiers (min/max units and rate per unit), a fixed
// monthly charge, and a surcharge percentage for late payments.
// =============================================================================

import mongoose from 'mongoose';

// Sub-schema for individual rate tiers within a tariff slab
const slabTierSchema = new mongoose.Schema(
  {
    // Minimum units for this tier (inclusive)
    minUnit: {
      type: Number,
      required: true,
    },

    // Maximum units for this tier (inclusive, use Infinity for uncapped)
    maxUnit: {
      type: Number,
      required: true,
    },

    // Rate per unit in this tier (in ₹)
    ratePerUnit: {
      type: Number,
      required: true,
    },
  },
  { _id: false } // No need for separate _id on sub-documents
);

const tariffSlabSchema = new mongoose.Schema(
  {
    // Human-readable name for this tariff slab
    name: {
      type: String,
      required: [true, 'Tariff slab name is required'],
      trim: true,
    },

    // Connection type this slab applies to
    connectionType: {
      type: String,
      enum: ['domestic', 'commercial', 'industrial'],
      required: true,
    },

    // Array of rate tiers — sorted by minUnit ascending
    slabs: {
      type: [slabTierSchema],
      required: true,
      validate: {
        validator: (v) => v.length > 0,
        message: 'At least one slab tier is required',
      },
    },

    // Fixed monthly charge (in ₹) added to every bill
    fixedCharge: {
      type: Number,
      required: true,
      default: 50,
    },

    // Surcharge percentage applied to overdue bills
    surchargePercent: {
      type: Number,
      required: true,
      default: 5,
    },
  },
  {
    timestamps: true,
  }
);

const TariffSlab = mongoose.model('TariffSlab', tariffSlabSchema);
export default TariffSlab;
