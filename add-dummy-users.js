import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';
import Meter from './models/Meter.js';
import TariffSlab from './models/TariffSlab.js';

async function addDummyUsers() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  // get tariff slabs to assign
  const domesticTariff = await TariffSlab.findOne({ connectionType: 'domestic' });
  const commercialTariff = await TariffSlab.findOne({ connectionType: 'commercial' });
  const industrialTariff = await TariffSlab.findOne({ connectionType: 'industrial' });

  const dummyData = [
    { name: 'a', email: 'a@gmail.com', connectionType: 'domestic', tariffSlab: domesticTariff?._id },
    { name: 'b', email: 'b@gmail.com', connectionType: 'commercial', tariffSlab: commercialTariff?._id },
    { name: 'c', email: 'c@gmail.com', connectionType: 'industrial', tariffSlab: industrialTariff?._id },
    { name: 'd', email: 'd@gmail.com', connectionType: 'domestic', tariffSlab: domesticTariff?._id },
    { name: 'e', email: 'e@gmail.com', connectionType: 'commercial', tariffSlab: commercialTariff?._id }
  ];

  for (let i = 0; i < dummyData.length; i++) {
    const data = dummyData[i];
    // Create user
    let user = await User.findOne({ email: data.email });
    if (!user) {
      user = await User.create({
        name: data.name,
        email: data.email,
        password: '123456',
        role: 'consumer',
        consumerId: `CON-DUMMY-${i+1}`,
        connectionType: data.connectionType,
        tariffSlab: data.tariffSlab,
        phone: '1234567890'
      });
      console.log(`User ${data.name} created.`);
    } else {
      console.log(`User ${data.name} already exists.`);
    }

    // Create a meter for the user so meter readers can see them
    let meter = await Meter.findOne({ consumer: user._id });
    if (!meter) {
      await Meter.create({
        meterNumber: `MTR-DUMMY-${i+1}`,
        consumer: user._id,
        status: 'active',
        lastReading: Math.floor(Math.random() * 500) + 100,
        installationDate: new Date()
      });
      console.log(`Meter for ${data.name} created.`);
    } else {
      console.log(`Meter for ${data.name} already exists.`);
    }
  }

  console.log('Done!');
  process.exit(0);
}

addDummyUsers();
