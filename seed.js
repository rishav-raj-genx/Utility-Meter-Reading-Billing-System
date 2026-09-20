// =============================================================================
// seed.js — Database Seed Script
// =============================================================================
// Seeds the database with:
// 1. Default admin user
// 2. Sample tariff slabs (domestic, commercial, industrial)
// 3. Sample consumers with meter reader
// 4. Sample meters assigned to consumers
//
// Run: node seed.js
// =============================================================================

import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';
import TariffSlab from './models/TariffSlab.js';
import Meter from './models/Meter.js';
import Bill from './models/Bill.js';

const seed = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB for seeding.');

    // =========================================================================
    // Clear existing data
    // =========================================================================
    await User.deleteMany({});
    await TariffSlab.deleteMany({});
    await Meter.deleteMany({});
    await Bill.deleteMany({});
    console.log('🗑️  Cleared existing data.');

    // =========================================================================
    // 1. Create Tariff Slabs
    // =========================================================================
    const domesticTariff = await TariffSlab.create({
      name: 'Domestic Standard',
      connectionType: 'domestic',
      slabs: [
        { minUnit: 0, maxUnit: 100, ratePerUnit: 3 },
        { minUnit: 101, maxUnit: 300, ratePerUnit: 5 },
        { minUnit: 301, maxUnit: 500, ratePerUnit: 7 },
        { minUnit: 501, maxUnit: 99999, ratePerUnit: 10 },
      ],
      fixedCharge: 50,
      surchargePercent: 5,
    });

    const commercialTariff = await TariffSlab.create({
      name: 'Commercial Standard',
      connectionType: 'commercial',
      slabs: [
        { minUnit: 0, maxUnit: 200, ratePerUnit: 6 },
        { minUnit: 201, maxUnit: 500, ratePerUnit: 8 },
        { minUnit: 501, maxUnit: 99999, ratePerUnit: 12 },
      ],
      fixedCharge: 100,
      surchargePercent: 8,
    });

    const industrialTariff = await TariffSlab.create({
      name: 'Industrial Standard',
      connectionType: 'industrial',
      slabs: [
        { minUnit: 0, maxUnit: 500, ratePerUnit: 5 },
        { minUnit: 501, maxUnit: 2000, ratePerUnit: 7 },
        { minUnit: 2001, maxUnit: 99999, ratePerUnit: 9 },
      ],
      fixedCharge: 200,
      surchargePercent: 10,
    });

    console.log('📊 Created tariff slabs.');

    // =========================================================================
    // 2. Create Users
    // =========================================================================

    // Admin user
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@utility.com',
      password: 'admin123',
      role: 'admin',
    });

    const userAdmin = await User.create({
      name: 'Rishav Raj',
      email: 'rishavraj.rr1234@gmail.com',
      password: '123456',
      role: 'admin',
    });

    // Meter Reader
    const reader = await User.create({
      name: 'Rajesh Kumar',
      email: 'reader@utility.com',
      password: 'reader123',
      role: 'meter_reader',
    });

    // Consumers
    const consumer1 = await User.create({
      name: 'Amit Sharma',
      email: 'amit@example.com',
      password: 'consumer123',
      role: 'consumer',
      consumerId: 'CON-001',
      connectionType: 'domestic',
      tariffSlab: domesticTariff._id,
      address: '42, MG Road, Delhi',
      phone: '9876543210',
    });

    const consumer2 = await User.create({
      name: 'Priya Electronics Ltd',
      email: 'priya@example.com',
      password: 'consumer123',
      role: 'consumer',
      consumerId: 'CON-002',
      connectionType: 'commercial',
      tariffSlab: commercialTariff._id,
      address: '15, Industrial Area, Mumbai',
      phone: '9876543211',
    });

    const consumer3 = await User.create({
      name: 'Tata Steel Works',
      email: 'tata@example.com',
      password: 'consumer123',
      role: 'consumer',
      consumerId: 'CON-003',
      connectionType: 'industrial',
      tariffSlab: industrialTariff._id,
      address: '1, Factory Road, Jamshedpur',
      phone: '9876543212',
    });

    console.log('👤 Created users (admin, meter reader, 3 consumers).');

    // =========================================================================
    // 3. Create Meters
    // =========================================================================
    const meter1 = await Meter.create({
      meterNumber: 'MTR-001',
      consumer: consumer1._id,
      status: 'active',
      lastReading: 500,
      readings: [
        { value: 500, date: new Date('2024-08-15'), readBy: reader._id },
      ],
    });

    const meter2 = await Meter.create({
      meterNumber: 'MTR-002',
      consumer: consumer2._id,
      status: 'active',
      lastReading: 1200,
      readings: [
        { value: 1200, date: new Date('2024-08-15'), readBy: reader._id },
      ],
    });

    const meter3 = await Meter.create({
      meterNumber: 'MTR-003',
      consumer: consumer3._id,
      status: 'active',
      lastReading: 5000,
      readings: [
        { value: 5000, date: new Date('2024-08-15'), readBy: reader._id },
      ],
    });

    console.log('📟 Created meters (3 meters assigned to consumers).');

    // =========================================================================
    // 4. Create Sample Bills
    // =========================================================================
    await Bill.create({
      consumer: consumer1._id,
      meter: meter1._id,
      billingPeriod: { month: 7, year: 2024 },
      previousReading: 300,
      currentReading: 500,
      unitsConsumed: 200,
      slabBreakdown: [
        { slab: '0–100 units @ ₹3/unit', units: 100, rate: 3, amount: 300 },
        { slab: '101–300 units @ ₹5/unit', units: 100, rate: 5, amount: 500 },
      ],
      fixedCharge: 50,
      subtotal: 850,
      totalAmount: 850,
      dueDate: new Date('2024-08-15'),
      status: 'paid',
      paidAt: new Date('2024-08-10'),
    });

    await Bill.create({
      consumer: consumer2._id,
      meter: meter2._id,
      billingPeriod: { month: 7, year: 2024 },
      previousReading: 800,
      currentReading: 1200,
      unitsConsumed: 400,
      slabBreakdown: [
        { slab: '0–200 units @ ₹6/unit', units: 200, rate: 6, amount: 1200 },
        { slab: '201–500 units @ ₹8/unit', units: 200, rate: 8, amount: 1600 },
      ],
      fixedCharge: 100,
      subtotal: 2900,
      totalAmount: 2900,
      dueDate: new Date('2024-08-15'),
      status: 'pending',
    });

    await Bill.create({
      consumer: consumer3._id,
      meter: meter3._id,
      billingPeriod: { month: 7, year: 2024 },
      previousReading: 3500,
      currentReading: 5000,
      unitsConsumed: 1500,
      slabBreakdown: [
        { slab: '0–500 units @ ₹5/unit', units: 500, rate: 5, amount: 2500 },
        { slab: '501–2000 units @ ₹7/unit', units: 1000, rate: 7, amount: 7000 },
      ],
      fixedCharge: 200,
      subtotal: 9700,
      totalAmount: 10670,
      dueDate: new Date('2024-08-15'),
      status: 'overdue',
      surcharge: 970,
    });

    console.log('🧾 Created sample bills (1 paid, 1 pending, 1 overdue).');

    // =========================================================================
    // Done
    // =========================================================================
    console.log('\n✅ Database seeded successfully!');
    console.log('─'.repeat(50));
    console.log('📧 Admin:        admin@utility.com / admin123');
    console.log('📧 Meter Reader: reader@utility.com / reader123');
    console.log('📧 Consumer 1:   amit@example.com / consumer123');
    console.log('📧 Consumer 2:   priya@example.com / consumer123');
    console.log('📧 Consumer 3:   tata@example.com / consumer123');
    console.log('─'.repeat(50));

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seed();
