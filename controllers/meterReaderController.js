// =============================================================================
// controllers/meterReaderController.js — Meter Reader Controller
// =============================================================================
// Handles meter reader operations: listing available meters and entering
// monthly readings. Validates that new readings are never lower than the
// previous reading. On valid submission, triggers the billing engine to
// auto-generate the consumer's bill.
// =============================================================================

import Meter from '../models/Meter.js';
import Bill from '../models/Bill.js';
import User from '../models/User.js';
import TariffSlab from '../models/TariffSlab.js';
import { calculateBill } from '../utils/billingEngine.js';

/**
 * listMeters — Displays all active meters for the meter reader to enter readings.
 */
export const listMeters = async (req, res) => {
  try {
    const meters = await Meter.find({ status: 'active' })
      .populate('consumer', 'name consumerId connectionType')
      .sort({ meterNumber: 1 })
      .lean();

    res.render('meter-reader/meters', {
      title: 'Meters to Read',
      meters,
    });
  } catch (error) {
    console.error('Meter reader list error:', error);
    req.flash('error', 'Failed to load meters.');
    res.redirect('/');
  }
};

/**
 * renderEnterReading — Displays the reading entry form for a specific meter.
 */
export const renderEnterReading = async (req, res) => {
  try {
    const { id } = req.params;
    const meter = await Meter.findById(id)
      .populate('consumer', 'name consumerId')
      .lean();

    if (!meter) {
      req.flash('error', 'Meter not found.');
      return res.redirect('/meter-reader/meters');
    }

    res.render('meter-reader/enter-reading', {
      title: 'Enter Reading',
      meter,
    });
  } catch (error) {
    console.error('Render enter reading error:', error);
    req.flash('error', 'Failed to load meter.');
    res.redirect('/meter-reader/meters');
  }
};

/**
 * submitReading — Processes a new meter reading submission.
 *
 * Validation Rules:
 * - New reading must be a positive number
 * - New reading must be >= the previous (last) reading
 *
 * On success:
 * - Adds the reading to the meter's readings array
 * - Updates the meter's lastReading
 * - Triggers the billing engine to generate a bill
 */
export const submitReading = async (req, res) => {
  try {
    const { id } = req.params;
    const { reading } = req.body;
    const newReading = Number(reading);

    // -------------------------------------------------------------------------
    // Fetch the meter
    // -------------------------------------------------------------------------
    const meter = await Meter.findById(id).populate('consumer');
    if (!meter) {
      req.flash('error', 'Meter not found.');
      return res.redirect('/meter-reader/meters');
    }

    // -------------------------------------------------------------------------
    // VALIDATION: Reject reading lower than previous reading
    // -------------------------------------------------------------------------
    if (isNaN(newReading) || newReading < 0) {
      req.flash('error', 'Please enter a valid positive reading.');
      return res.redirect(`/meter-reader/meters/${id}/reading`);
    }

    if (newReading < meter.lastReading) {
      req.flash(
        'error',
        `Reading rejected! New reading (${newReading}) cannot be lower than previous reading (${meter.lastReading}).`
      );
      return res.redirect(`/meter-reader/meters/${id}/reading`);
    }

    // -------------------------------------------------------------------------
    // Fetch the consumer's tariff slab for billing
    // -------------------------------------------------------------------------
    const consumer = await User.findById(meter.consumer._id || meter.consumer)
      .populate('tariffSlab');
    
    if (!consumer || !consumer.tariffSlab) {
      req.flash('error', 'Consumer has no tariff slab assigned. Please contact admin.');
      return res.redirect('/meter-reader/meters');
    }

    // -------------------------------------------------------------------------
    // Calculate the bill using the billing engine
    // -------------------------------------------------------------------------
    const previousReading = meter.lastReading;
    const billData = calculateBill(previousReading, newReading, consumer.tariffSlab);

    // Determine billing period (current month/year)
    const now = new Date();
    const billingMonth = now.getMonth() + 1; // 1-indexed
    const billingYear = now.getFullYear();

    // -------------------------------------------------------------------------
    // Check for duplicate bill (same meter + period)
    // -------------------------------------------------------------------------
    const existingBill = await Bill.findOne({
      meter: meter._id,
      'billingPeriod.month': billingMonth,
      'billingPeriod.year': billingYear,
    });

    if (existingBill) {
      req.flash('error', 'A bill has already been generated for this meter this month.');
      return res.redirect('/meter-reader/meters');
    }

    // -------------------------------------------------------------------------
    // Save the reading to the meter
    // -------------------------------------------------------------------------
    meter.readings.push({
      value: newReading,
      date: now,
      readBy: req.user._id,
    });
    meter.lastReading = newReading;
    await meter.save();

    // -------------------------------------------------------------------------
    // Create the bill
    // -------------------------------------------------------------------------
    await Bill.create({
      consumer: consumer._id,
      meter: meter._id,
      billingPeriod: { month: billingMonth, year: billingYear },
      previousReading,
      currentReading: newReading,
      unitsConsumed: billData.unitsConsumed,
      slabBreakdown: billData.slabBreakdown,
      fixedCharge: billData.fixedCharge,
      subtotal: billData.subtotal,
      totalAmount: billData.totalAmount,
      dueDate: billData.dueDate,
    });

    req.flash(
      'success',
      `Reading recorded (${newReading} kWh) and bill generated for ${consumer.name}. Units: ${billData.unitsConsumed}, Amount: ₹${billData.totalAmount}`
    );
    res.redirect('/meter-reader/meters');
  } catch (error) {
    console.error('Submit reading error:', error);
    req.flash('error', 'Failed to submit reading. ' + error.message);
    res.redirect('/meter-reader/meters');
  }
};
