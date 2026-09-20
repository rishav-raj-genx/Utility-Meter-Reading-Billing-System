// =============================================================================
// utils/surchargeJob.js — Late Payment Surcharge Cron Job
// =============================================================================
// Runs daily at midnight (00:00) to check for overdue bills. If a bill's
// due date has passed and it is still 'pending', this job marks it as
// 'overdue' and applies the surcharge percentage from the consumer's
// tariff slab to the bill's total amount.
// =============================================================================

import cron from 'node-cron';
import Bill from '../models/Bill.js';
import User from '../models/User.js';
import TariffSlab from '../models/TariffSlab.js';

/**
 * initSurchargeJob — Starts the daily cron job for late payment surcharges.
 * Scheduled to run every day at midnight (00:00).
 */
export const initSurchargeJob = () => {
  // Cron expression: "0 0 * * *" = At 00:00 every day
  cron.schedule('0 0 * * *', async () => {
    console.log('⏰ [Surcharge Job] Running daily overdue bill check...');

    try {
      const now = new Date();

      // -----------------------------------------------------------------------
      // Find all pending bills where the due date has passed
      // -----------------------------------------------------------------------
      const overdueBills = await Bill.find({
        status: 'pending',
        dueDate: { $lt: now },
      }).populate('consumer');

      console.log(
        `⏰ [Surcharge Job] Found ${overdueBills.length} overdue bill(s).`
      );

      for (const bill of overdueBills) {
        // -------------------------------------------------------------------
        // Look up the consumer's tariff slab to get surcharge percentage
        // -------------------------------------------------------------------
        const consumer = await User.findById(bill.consumer._id || bill.consumer);
        let surchargePercent = 5; // Default 5% if no slab found

        if (consumer && consumer.tariffSlab) {
          const slab = await TariffSlab.findById(consumer.tariffSlab);
          if (slab) {
            surchargePercent = slab.surchargePercent;
          }
        }

        // -------------------------------------------------------------------
        // Calculate and apply surcharge
        // -------------------------------------------------------------------
        const surchargeAmount =
          Math.round(bill.subtotal * (surchargePercent / 100) * 100) / 100;

        bill.surcharge = surchargeAmount;
        bill.totalAmount = Math.round((bill.subtotal + surchargeAmount) * 100) / 100;
        bill.status = 'overdue';

        await bill.save();

        console.log(
          `⏰ [Surcharge Job] Bill ${bill._id} marked overdue. Surcharge: ₹${surchargeAmount}`
        );
      }

      console.log('⏰ [Surcharge Job] Completed.');
    } catch (error) {
      console.error('❌ [Surcharge Job] Error:', error.message);
    }
  });

  console.log('⏰ Surcharge cron job scheduled (daily at midnight).');
};
