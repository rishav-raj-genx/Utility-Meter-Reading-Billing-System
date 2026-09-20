// =============================================================================
// controllers/adminController.js — Admin Controller
// =============================================================================
// Handles all admin operations: dashboard analytics, consumer CRUD,
// meter management, and tariff slab configuration.
// =============================================================================

import User from '../models/User.js';
import Meter from '../models/Meter.js';
import Bill from '../models/Bill.js';
import TariffSlab from '../models/TariffSlab.js';

// =============================================================================
// DASHBOARD
// =============================================================================

/**
 * dashboard — Renders the admin dashboard with aggregated analytics:
 * total bills, paid/unpaid ratios, total units billed, top consumers.
 */
export const dashboard = async (req, res) => {
  try {
    // -------------------------------------------------------------------------
    // Aggregate bill statistics
    // -------------------------------------------------------------------------
    const totalBills = await Bill.countDocuments();
    const paidBills = await Bill.countDocuments({ status: 'paid' });
    const pendingBills = await Bill.countDocuments({ status: 'pending' });
    const overdueBills = await Bill.countDocuments({ status: 'overdue' });

    // Total units billed across all bills
    const unitsAgg = await Bill.aggregate([
      { $group: { _id: null, totalUnits: { $sum: '$unitsConsumed' } } },
    ]);
    const totalUnits = unitsAgg.length > 0 ? unitsAgg[0].totalUnits : 0;

    // Total revenue collected (paid bills)
    const revenueAgg = await Bill.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0;

    // -------------------------------------------------------------------------
    // Top 5 consumers by total units consumed
    // -------------------------------------------------------------------------
    const topConsumers = await Bill.aggregate([
      { $group: { _id: '$consumer', totalUnits: { $sum: '$unitsConsumed' }, totalAmount: { $sum: '$totalAmount' } } },
      { $sort: { totalUnits: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'consumerData',
        },
      },
      { $unwind: '$consumerData' },
      {
        $project: {
          name: '$consumerData.name',
          consumerId: '$consumerData.consumerId',
          totalUnits: 1,
          totalAmount: 1,
        },
      },
    ]);

    // -------------------------------------------------------------------------
    // Monthly billing trend (last 6 months)
    // -------------------------------------------------------------------------
    const monthlyTrend = await Bill.aggregate([
      {
        $group: {
          _id: { month: '$billingPeriod.month', year: '$billingPeriod.year' },
          totalUnits: { $sum: '$unitsConsumed' },
          totalAmount: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 6 },
    ]);

    // Count totals
    const totalConsumers = await User.countDocuments({ role: 'consumer' });
    const totalMeters = await Meter.countDocuments();

    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      totalBills,
      paidBills,
      pendingBills,
      overdueBills,
      totalUnits,
      totalRevenue,
      topConsumers,
      monthlyTrend: monthlyTrend.reverse(),
      totalConsumers,
      totalMeters,
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    req.flash('error', 'Failed to load dashboard.');
    res.redirect('/');
  }
};

// =============================================================================
// CONSUMER MANAGEMENT
// =============================================================================

/**
 * listConsumers — Lists all consumer users with their assigned tariff slabs.
 */
export const listConsumers = async (req, res) => {
  try {
    const consumers = await User.find({ role: 'consumer' })
      .populate('tariffSlab')
      .sort({ createdAt: -1 })
      .lean();
    const tariffSlabs = await TariffSlab.find().lean();

    res.render('admin/consumers', {
      title: 'Manage Consumers',
      consumers,
      tariffSlabs,
    });
  } catch (error) {
    console.error('List consumers error:', error);
    req.flash('error', 'Failed to load consumers.');
    res.redirect('/admin/dashboard');
  }
};

/**
 * createConsumer — Creates a new consumer user with assigned ID and tariff.
 */
export const createConsumer = async (req, res) => {
  try {
    const { name, email, password, consumerId, connectionType, tariffSlab, address, phone } = req.body;

    // Check for duplicate email or consumerId
    const existing = await User.findOne({ $or: [{ email }, { consumerId }] });
    if (existing) {
      req.flash('error', 'A consumer with this email or ID already exists.');
      return res.redirect('/admin/consumers');
    }

    await User.create({
      name,
      email,
      password,
      role: 'consumer',
      consumerId,
      connectionType,
      tariffSlab: tariffSlab || undefined,
      address,
      phone,
    });

    req.flash('success', 'Consumer created successfully.');
    res.redirect('/admin/consumers');
  } catch (error) {
    console.error('Create consumer error:', error);
    req.flash('error', 'Failed to create consumer.');
    res.redirect('/admin/consumers');
  }
};

/**
 * updateConsumer — Updates an existing consumer's details.
 */
export const updateConsumer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, consumerId, connectionType, tariffSlab, address, phone } = req.body;

    await User.findByIdAndUpdate(id, {
      name,
      consumerId,
      connectionType,
      tariffSlab: tariffSlab || undefined,
      address,
      phone,
    });

    req.flash('success', 'Consumer updated successfully.');
    res.redirect('/admin/consumers');
  } catch (error) {
    console.error('Update consumer error:', error);
    req.flash('error', 'Failed to update consumer.');
    res.redirect('/admin/consumers');
  }
};

/**
 * deleteConsumer — Deletes a consumer user by ID.
 */
export const deleteConsumer = async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    req.flash('success', 'Consumer deleted.');
    res.redirect('/admin/consumers');
  } catch (error) {
    console.error('Delete consumer error:', error);
    req.flash('error', 'Failed to delete consumer.');
    res.redirect('/admin/consumers');
  }
};

// =============================================================================
// METER MANAGEMENT
// =============================================================================

/**
 * listMeters — Lists all meters with their assigned consumers.
 */
export const listMeters = async (req, res) => {
  try {
    const meters = await Meter.find()
      .populate('consumer', 'name consumerId email')
      .sort({ createdAt: -1 })
      .lean();
    const consumers = await User.find({ role: 'consumer' }).lean();

    res.render('admin/meters', {
      title: 'Manage Meters',
      meters,
      consumers,
    });
  } catch (error) {
    console.error('List meters error:', error);
    req.flash('error', 'Failed to load meters.');
    res.redirect('/admin/dashboard');
  }
};

/**
 * createMeter — Creates a new meter assigned to a consumer.
 */
export const createMeter = async (req, res) => {
  try {
    const { meterNumber, consumer, installationDate } = req.body;

    const existing = await Meter.findOne({ meterNumber });
    if (existing) {
      req.flash('error', 'A meter with this number already exists.');
      return res.redirect('/admin/meters');
    }

    await Meter.create({
      meterNumber,
      consumer,
      installationDate: installationDate || Date.now(),
    });

    req.flash('success', 'Meter created successfully.');
    res.redirect('/admin/meters');
  } catch (error) {
    console.error('Create meter error:', error);
    req.flash('error', 'Failed to create meter.');
    res.redirect('/admin/meters');
  }
};

/**
 * deleteMeter — Deletes a meter by ID.
 */
export const deleteMeter = async (req, res) => {
  try {
    const { id } = req.params;
    await Meter.findByIdAndDelete(id);
    req.flash('success', 'Meter deleted.');
    res.redirect('/admin/meters');
  } catch (error) {
    console.error('Delete meter error:', error);
    req.flash('error', 'Failed to delete meter.');
    res.redirect('/admin/meters');
  }
};

// =============================================================================
// TARIFF SLAB MANAGEMENT
// =============================================================================

/**
 * listTariffs — Lists all tariff slabs for management.
 */
export const listTariffs = async (req, res) => {
  try {
    const tariffs = await TariffSlab.find().sort({ connectionType: 1 }).lean();

    res.render('admin/tariffs', {
      title: 'Manage Tariff Slabs',
      tariffs,
    });
  } catch (error) {
    console.error('List tariffs error:', error);
    req.flash('error', 'Failed to load tariffs.');
    res.redirect('/admin/dashboard');
  }
};

/**
 * createTariff — Creates a new tariff slab with rate tiers.
 */
export const createTariff = async (req, res) => {
  try {
    const { name, connectionType, fixedCharge, surchargePercent } = req.body;

    // Parse slab tiers from form data (arrays of minUnit, maxUnit, ratePerUnit)
    const minUnits = Array.isArray(req.body.minUnit) ? req.body.minUnit : [req.body.minUnit];
    const maxUnits = Array.isArray(req.body.maxUnit) ? req.body.maxUnit : [req.body.maxUnit];
    const rates = Array.isArray(req.body.ratePerUnit) ? req.body.ratePerUnit : [req.body.ratePerUnit];

    const slabs = minUnits.map((min, i) => ({
      minUnit: Number(min),
      maxUnit: Number(maxUnits[i]),
      ratePerUnit: Number(rates[i]),
    }));

    await TariffSlab.create({
      name,
      connectionType,
      slabs,
      fixedCharge: Number(fixedCharge),
      surchargePercent: Number(surchargePercent),
    });

    req.flash('success', 'Tariff slab created successfully.');
    res.redirect('/admin/tariffs');
  } catch (error) {
    console.error('Create tariff error:', error);
    req.flash('error', 'Failed to create tariff slab.');
    res.redirect('/admin/tariffs');
  }
};

/**
 * deleteTariff — Deletes a tariff slab by ID.
 */
export const deleteTariff = async (req, res) => {
  try {
    const { id } = req.params;
    await TariffSlab.findByIdAndDelete(id);
    req.flash('success', 'Tariff slab deleted.');
    res.redirect('/admin/tariffs');
  } catch (error) {
    console.error('Delete tariff error:', error);
    req.flash('error', 'Failed to delete tariff slab.');
    res.redirect('/admin/tariffs');
  }
};
