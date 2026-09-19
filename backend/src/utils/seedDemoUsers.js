// Run once: node src/utils/seedDemoUsers.js
// Creates fixed-credential demo accounts so portfolio visitors can log in
// instantly without registering. Safe to re-run — skips if they already exist.
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Ticket = require('../models/Ticket');

const DEMO_USERS = [
  { name: 'Demo Customer', email: 'demo.customer@supportflow.dev', password: 'demopass123', role: 'customer', isDemo: true },
  { name: 'Demo Agent', email: 'demo.agent@supportflow.dev', password: 'demopass123', role: 'agent', skills: ['Billing', 'Login', 'General'], isDemo: true }
];

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  for (const u of DEMO_USERS) {
    const existing = await User.findOne({ email: u.email });
    if (existing) {
      // Backfill isDemo on accounts seeded before this flag existed.
      if (!existing.isDemo) {
        existing.isDemo = true;
        await existing.save();
        console.log(`Backfilled isDemo=true on existing account: ${u.email}`);
      } else {
        console.log(`Skipped (already exists): ${u.email}`);
      }
      continue;
    }
    await User.create(u);
    console.log(`Created: ${u.email}`);
  }

  // Backfill: any tickets already created by the demo customer before this
  // fix existed were saved with isDemo: false (the old schema default).
  // Tag them isDemo: true now so they don't leak into the real agent queue.
  const demoCustomer = await User.findOne({ email: 'demo.customer@supportflow.dev' });
  if (demoCustomer) {
    const result = await Ticket.updateMany(
      { customer: demoCustomer._id, isDemo: { $ne: true } },
      { $set: { isDemo: true } }
    );
    if (result.modifiedCount > 0) {
      console.log(`Backfilled isDemo=true on ${result.modifiedCount} existing demo ticket(s).`);
    }
  }

  await mongoose.disconnect();
  console.log('Done.');
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});