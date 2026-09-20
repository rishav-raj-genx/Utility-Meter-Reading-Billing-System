// =============================================================================
// models/Bill.js — Bill Schema
// =============================================================================
// Represents a monthly electricity bill generated for a consumer. Contains
// the full slab-wise breakdown of charges, fixed charges, surcharge (if late),
// and payment status tracking.
// =============================================================================

import mongoose from 'mongoose';

// Sub-schema for the slab-wise cost breakdown shown on each bill
const slabBreakdownSchema = new mongoose.Schema(
  {
    // Description of the slab tier (e.g., "0–100 units @ ₹3/unit")
    slab: {
      type: String,
      required: true,
    },

    // Number of units billed in this tier
    units: {
      type: Number,
      required: true,
    },

    // Rate per unit for this tier
    rate: {
      type: Number,
      required: true,
    },

    // Total amount for this tier (units × rate)
    amount: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const billSchema = new mongoose.Schema(
  {
    // Consumer this bill belongs to
    consumer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Meter from which the reading was taken
    meter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meter',
      required: true,
    },

    // Billing period — month (1-12) and year
    billingPeriod: {
      month: { type: Number, required: true },
      year: { type: Number, required: true },
    },

    // Previous month's meter reading
    previousReading: {
      type: Number,
      required: true,
    },

    // Current month's meter reading
    currentReading: {
      type: Number,
      required: true,
    },

    // Total units consumed this billing period
    unitsConsumed: {
      type: Number,
      required: true,
    },

    // Detailed slab-wise cost breakdown
    slabBreakdown: [slabBreakdownSchema],

    // Fixed monthly charge
    fixedCharge: {
      type: Number,
      required: true,
    },

    // Subtotal before surcharge (slab total + fixed charge)
    subtotal: {
      type: Number,
      required: true,
    },

    // Late payment surcharge amount (0 if paid on time)
    surcharge: {
      type: Number,
      default: 0,
    },

    // Final total amount payable
    totalAmount: {
      type: Number,
      required: true,
    },

    // Due date for payment (15 days after bill generation)
    dueDate: {
      type: Date,
      required: true,
    },

    // Payment status of the bill
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue'],
      default: 'pending',
    },

    // Timestamp of when the bill was paid (null if unpaid)
    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// =============================================================================
// Compound Index: Prevent duplicate bills for same meter/period
// =============================================================================
billSchema.index(
  { meter: 1, 'billingPeriod.month': 1, 'billingPeriod.year': 1 },
  { unique: true }
);

const Bill = mongoose.model('Bill', billSchema);
export default Bill;
