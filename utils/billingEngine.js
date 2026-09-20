// =============================================================================
// utils/billingEngine.js — Slab-Based Billing Calculator
// =============================================================================
// Pure utility function that calculates electricity bills based on units
// consumed and the applicable tariff slab. Returns a complete bill breakdown
// including slab-wise charges, fixed charges, and due date.
// =============================================================================

/**
 * calculateBill — Computes a detailed bill from meter readings and tariff slab.
 *
 * @param {number} previousReading - Previous month's meter reading (kWh)
 * @param {number} currentReading  - Current month's meter reading (kWh)
 * @param {Object} tariffSlab      - Tariff slab document from database
 * @returns {Object} Bill calculation result:
 *   {
 *     unitsConsumed: number,
 *     slabBreakdown: Array<{ slab: string, units: number, rate: number, amount: number }>,
 *     fixedCharge: number,
 *     subtotal: number,
 *     totalAmount: number,
 *     dueDate: Date
 *   }
 */
export const calculateBill = (previousReading, currentReading, tariffSlab) => {
  // -------------------------------------------------------------------------
  // Step 1: Calculate total units consumed
  // -------------------------------------------------------------------------
  const unitsConsumed = currentReading - previousReading;

  // -------------------------------------------------------------------------
  // Step 2: Calculate slab-wise charges
  // -------------------------------------------------------------------------
  // Sort slabs by minUnit to ensure correct order of calculation
  const sortedSlabs = [...tariffSlab.slabs].sort((a, b) => a.minUnit - b.minUnit);
  const slabBreakdown = [];
  let remainingUnits = unitsConsumed;
  let slabTotal = 0;

  for (const tier of sortedSlabs) {
    if (remainingUnits <= 0) break;

    // Calculate how many units fall into this tier
    const tierRange = tier.maxUnit - tier.minUnit;
    const unitsInTier = Math.min(remainingUnits, tierRange);

    // Calculate cost for this tier
    const tierAmount = unitsInTier * tier.ratePerUnit;

    // Add to breakdown
    slabBreakdown.push({
      slab: `${tier.minUnit}–${tier.maxUnit} units @ ₹${tier.ratePerUnit}/unit`,
      units: unitsInTier,
      rate: tier.ratePerUnit,
      amount: Math.round(tierAmount * 100) / 100,
    });

    slabTotal += tierAmount;
    remainingUnits -= unitsInTier;
  }

  // -------------------------------------------------------------------------
  // Step 3: Add fixed monthly charge
  // -------------------------------------------------------------------------
  const fixedCharge = tariffSlab.fixedCharge;
  const subtotal = Math.round((slabTotal + fixedCharge) * 100) / 100;

  // -------------------------------------------------------------------------
  // Step 4: Calculate due date (15 days from generation)
  // -------------------------------------------------------------------------
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 15);

  return {
    unitsConsumed,
    slabBreakdown,
    fixedCharge,
    subtotal,
    totalAmount: subtotal, // Surcharge added later if overdue
    dueDate,
  };
};
