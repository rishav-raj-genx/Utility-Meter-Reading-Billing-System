// =============================================================================
// controllers/consumerController.js — Consumer Controller
// =============================================================================
// Handles consumer-facing features: viewing the dashboard with current bill,
// paying bills, and viewing bill history with consumption trends.
// =============================================================================

import Bill from '../models/Bill.js';
import Meter from '../models/Meter.js';

/**
 * dashboard — Consumer's main view showing their current/latest bill
 * and a summary of consumption data.
 */
export const dashboard = async (req, res) => {
  try {
    const consumerId = req.user._id;

    // -------------------------------------------------------------------------
    // Get the consumer's latest bill
    // -------------------------------------------------------------------------
    const currentBill = await Bill.findOne({ consumer: consumerId })
      .sort({ createdAt: -1 })
      .populate('meter', 'meterNumber')
      .lean();

    // -------------------------------------------------------------------------
    // Get consumption history for chart (last 12 months)
    // -------------------------------------------------------------------------
    const consumptionHistory = await Bill.find({ consumer: consumerId })
      .sort({ 'billingPeriod.year': 1, 'billingPeriod.month': 1 })
      .limit(12)
      .lean();

    // -------------------------------------------------------------------------
    // Summary stats
    // -------------------------------------------------------------------------
    const totalBills = await Bill.countDocuments({ consumer: consumerId });
    const paidBills = await Bill.countDocuments({ consumer: consumerId, status: 'paid' });
    const pendingBills = await Bill.countDocuments({
      consumer: consumerId,
      status: { $in: ['pending', 'overdue'] },
    });

    // Total amount paid
    const paidAgg = await Bill.aggregate([
      { $match: { consumer: consumerId, status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalPaid = paidAgg.length > 0 ? paidAgg[0].total : 0;

    // Consumer's meter info
    const meter = await Meter.findOne({ consumer: consumerId }).lean();

    res.render('consumer/dashboard', {
      title: 'My Dashboard',
      currentBill,
      consumptionHistory,
      totalBills,
      paidBills,
      pendingBills,
      totalPaid,
      meter,
    });
  } catch (error) {
    console.error('Consumer dashboard error:', error);
    req.flash('error', 'Failed to load dashboard.');
    res.redirect('/');
  }
};

/**
 * billHistory — Lists all bills for the consumer, sorted by date.
 */
export const billHistory = async (req, res) => {
  try {
    const bills = await Bill.find({ consumer: req.user._id })
      .populate('meter', 'meterNumber')
      .sort({ createdAt: -1 })
      .lean();

    res.render('consumer/bills', {
      title: 'Bill History',
      bills,
    });
  } catch (error) {
    console.error('Bill history error:', error);
    req.flash('error', 'Failed to load bill history.');
    res.redirect('/consumer/dashboard');
  }
};

/**
 * billDetail — Shows detailed breakdown of a specific bill.
 */
export const billDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const bill = await Bill.findOne({ _id: id, consumer: req.user._id })
      .populate('meter', 'meterNumber')
      .populate('consumer', 'name consumerId connectionType address')
      .lean();

    if (!bill) {
      req.flash('error', 'Bill not found.');
      return res.redirect('/consumer/bills');
    }

    res.render('consumer/bill-detail', {
      title: `Bill Detail — ${bill.billingPeriod.month}/${bill.billingPeriod.year}`,
      bill,
    });
  } catch (error) {
    console.error('Bill detail error:', error);
    req.flash('error', 'Failed to load bill details.');
    res.redirect('/consumer/bills');
  }
};

/**
 * payBill — Marks a pending/overdue bill as paid.
 * In a real system, this would integrate with a payment gateway.
 */
export const payBill = async (req, res) => {
  try {
    const { id } = req.params;
    const bill = await Bill.findOne({ _id: id, consumer: req.user._id });

    if (!bill) {
      req.flash('error', 'Bill not found.');
      return res.redirect('/consumer/bills');
    }

    if (bill.status === 'paid') {
      req.flash('error', 'This bill has already been paid.');
      return res.redirect(`/consumer/bills/${id}`);
    }

    // Mark as paid
    bill.status = 'paid';
    bill.paidAt = new Date();
    await bill.save();

    req.flash('success', `Bill paid successfully! Amount: ₹${bill.totalAmount}`);
    res.redirect(`/consumer/bills/${id}`);
  } catch (error) {
    console.error('Pay bill error:', error);
    req.flash('error', 'Payment failed. Please try again.');
    res.redirect('/consumer/bills');
  }
};
