// Run once or on startup: node src/utils/seedDemoUsers.js
// Seeds realistic verified providers across categories, demo users, knowledge base runbooks, and bookings
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const Booking = require('../models/Booking');
const KnowledgeBase = require('../models/KnowledgeBase');

const DEMO_USERS = [
  {
    name: 'Demo Customer',
    email: 'demo.customer@supportflow.dev',
    password: 'demopass123',
    role: 'customer',
    location: 'Gulberg III, Lahore',
    isDemo: true
  },
  {
    name: 'Tariq Mahmood (Specialist Desk)',
    email: 'demo.agent@supportflow.dev',
    password: 'demopass123',
    role: 'agent',
    businessName: 'GreenThumb Landscape & Gardeners',
    category: 'Gardening',
    hourlyRate: 1800,
    rating: 4.95,
    reviewCount: 38,
    location: 'Lahore, Pakistan',
    bio: 'Certified master horticulturalist and landscape architect with 12+ years expertise in lawn grooming, irrigation, and tree surgery.',
    specialties: ['Lawn Restoration', 'Automatic Drip Irrigation', 'Hedge Trimming', 'Soil Fertilization', 'Organic Pest Control'],
    skills: ['Gardening', 'Technical / Bug', 'General'],
    isDemo: true
  },
  // Additional rich category providers
  {
    name: 'Kamran Ali',
    email: 'gardening.kamran@supportflow.dev',
    password: 'demopass123',
    role: 'agent',
    businessName: 'Botanica Flora & Landscape Studio',
    category: 'Gardening',
    hourlyRate: 2200,
    rating: 4.88,
    reviewCount: 29,
    location: 'DHA Phase 5, Lahore',
    bio: 'Expert botanist specializing in Japanese zen gardens, rooftop vertical gardening, and ornamental lawn development.',
    specialties: ['Rooftop Gardens', 'Floral Landscaping', 'Lawn Aeration', 'Tree Pruning'],
    skills: ['Gardening', 'General'],
    isDemo: true
  },
  {
    name: 'Rashid Khan',
    email: 'plumbing.rashid@supportflow.dev',
    password: 'demopass123',
    role: 'agent',
    businessName: 'FlowMaster 24/7 Rapid Plumbing',
    category: 'Plumbing',
    hourlyRate: 1600,
    rating: 4.92,
    reviewCount: 45,
    location: 'Gulberg & Model Town, Lahore',
    bio: 'Licensed sanitary engineer with thermal leak detection camera and hydraulic pipe replacement tools. 15-minute emergency response.',
    specialties: ['Underground Leak Detection', 'Water Heater Repair', 'Main Line Drainage', 'Bathroom Fitting', 'RO Filter Installation'],
    skills: ['Plumbing', 'Technical / Bug'],
    isDemo: true
  },
  {
    name: 'Zubair Qureshi',
    email: 'electrical.zubair@supportflow.dev',
    password: 'demopass123',
    role: 'agent',
    businessName: 'VoltCraft Certified Electricians',
    category: 'Electrical',
    hourlyRate: 1900,
    rating: 4.96,
    reviewCount: 52,
    location: 'Johar Town, Lahore',
    bio: 'Master certified electrician offering complete home rewiring, short-circuit troubleshooting, breaker panels, and solar inverter setup.',
    specialties: ['Distribution Board Upgrades', 'Short Circuit Diagnosis', 'Solar Inverter Wiring', 'Smart Home Lighting', 'Generator Backup'],
    skills: ['Electrical', 'Technical / Bug'],
    isDemo: true
  },
  {
    name: 'Usman Farooq',
    email: 'carpentry.usman@supportflow.dev',
    password: 'demopass123',
    role: 'agent',
    businessName: 'TimberCraft Bespoke Woodworks',
    category: 'Carpentry',
    hourlyRate: 2000,
    rating: 4.85,
    reviewCount: 31,
    location: 'Cantt, Lahore',
    bio: 'Artisan carpenter crafting custom walnut/teak furniture, bespoke kitchen cabinetry, acoustic wood panels, and door frame alignments.',
    specialties: ['Custom Cabinetry', 'Door & Window Latches', 'Solid Wood Restoration', 'Modular Kitchens', 'Wooden Decking'],
    skills: ['Carpentry', 'General'],
    isDemo: true
  },
  {
    name: 'Farzana Bibi',
    email: 'cleaning.farzana@supportflow.dev',
    password: 'demopass123',
    role: 'agent',
    businessName: 'Pristine Living Deep Cleaners',
    category: 'Cleaning',
    hourlyRate: 1400,
    rating: 4.98,
    reviewCount: 64,
    location: 'Bahria Town, Lahore',
    bio: 'Hospital-grade steam sanitation, deep carpet extraction shampooing, post-construction scrubbing, and spotless sofa rejuvenation.',
    specialties: ['Steam Deep Cleaning', 'Sofa & Mattress Shampoo', 'Post-Construction Cleanup', 'Kitchen Degreasing', 'Disinfection'],
    skills: ['Cleaning', 'General'],
    isDemo: true
  },
  {
    name: 'Bilal Butt',
    email: 'painting.bilal@supportflow.dev',
    password: 'demopass123',
    role: 'agent',
    businessName: 'Apex Precision Painting & Finishes',
    category: 'Painting',
    hourlyRate: 1750,
    rating: 4.89,
    reviewCount: 26,
    location: 'Wapda Town, Lahore',
    bio: 'Premium interior emulsion, weatherproof exterior damp-proofing coatings, airless spray finish, and textured accent walls.',
    specialties: ['Damp Proofing Sealant', 'Textured Feature Walls', 'Weatherproof Exterior', 'Wood Lacquer & Deco', 'Airless Spray'],
    skills: ['Painting', 'General'],
    isDemo: true
  },
  {
    name: 'Mohammad Asif',
    email: 'ac.asif@supportflow.dev',
    password: 'demopass123',
    role: 'agent',
    businessName: 'ChillWave Inverter & HVAC Care',
    category: 'AC Repair',
    hourlyRate: 2100,
    rating: 4.94,
    reviewCount: 57,
    location: 'Faisal Town, Lahore',
    bio: 'Specialist in inverter PCB board diagnostics, eco R32/R410A gas charging, jet-pump chemical master servicing, and ductless split installs.',
    specialties: ['Inverter PCB Board Repair', 'High-Pressure Chemical Wash', 'Gas Leak & Pressure Recharging', 'Compressor Replacement', 'Thermostat Calibration'],
    skills: ['AC Repair', 'Technical / Bug'],
    isDemo: true
  }
];

const DEFAULT_KB_ARTICLES = [
  {
    title: 'Gardening & Landscaping Quality Standards',
    category: 'Gardening',
    sourceCode: 'KB-GARD-101',
    tags: ['gardening', 'lawn', 'plants', 'landscaping', 'irrigation', 'grass'],
    content: 'All gardening jobs include soil testing for moisture and nitrogen balance before application of organic compost. Drip irrigation systems must undergo pressure calibration testing to prevent waterlogging. If customer reports yellowing grass or pest infestation within 7 days, a free inspection visit is dispatched.'
  },
  {
    title: 'Plumbing Emergency & Leak Remediation Policy',
    category: 'Plumbing',
    sourceCode: 'KB-PLUM-201',
    tags: ['leak', 'plumber', 'pipe', 'drain', 'water', 'sewage'],
    content: 'Emergency water leaks are triaged as High Priority with 4-hour SLA. Specialist must isolate main valve, deploy thermal imaging to detect hidden wall seepage, and provide written pressure test verification after pipe welding.'
  },
  {
    title: 'Billing Dispute & Service Refund Protocol',
    category: 'Billing',
    sourceCode: 'KB-BILL-204',
    tags: ['refund', 'invoice', 'charge', 'billing', 'subscription', 'pricing'],
    content: 'For duplicate or disputed service charges reported within 14 days, agents may issue an immediate adjustment or full refund without upper management approval. Verify the booking number and Stripe/payment gateway transaction ID before confirmation. Processing time is 3-5 business days.'
  },
  {
    title: 'Electrical Safety & Circuit Load Verification',
    category: 'Electrical',
    sourceCode: 'KB-ELEC-301',
    tags: ['electrical', 'wiring', 'spark', 'breaker', 'short circuit', 'voltage'],
    content: 'Specialists must carry insulated tools rated up to 1000V and perform insulation resistance testing (megger test) on all modified distribution panels. Any voltage fluctuation exceeding ±10% must be flagged immediately.'
  },
  {
    title: 'AC Cooling Efficiency & Gas Leak Protocol',
    category: 'AC Repair',
    sourceCode: 'KB-AC-401',
    tags: ['ac', 'cooling', 'inverter', 'gas', 'compressor', 'freon'],
    content: 'Before refilling refrigerant gas, technician must perform nitrogen pressure hold test for minimum 20 minutes to prove zero microscopic leaks in copper piping. Temperature drop across the evaporator coil must meet standard 10°C–14°C delta.'
  },
  {
    title: 'Service Cancellation & Guarantee Terms',
    category: 'General',
    sourceCode: 'KB-GEN-405',
    tags: ['cancel', 'reschedule', 'guarantee', 'warranty', 'policy'],
    content: 'Customers can cancel or reschedule bookings free of charge up to 2 hours before the scheduled time slot. All completed service bookings carry a 14-day SupportFlow Satisfaction Guarantee covered by our AI dispute resolution desk.'
  }
];

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB. Starting database seed & backfill...');

  let demoCustomer = null;
  let demoAgent = null;

  // 1. Seed or update demo accounts & providers
  for (const u of DEMO_USERS) {
    let user = await User.findOne({ email: u.email });
    if (user) {
      // Update provider details
      user.businessName = u.businessName || user.businessName;
      user.category = u.category || user.category;
      user.hourlyRate = u.hourlyRate || user.hourlyRate;
      user.rating = u.rating || user.rating;
      user.reviewCount = u.reviewCount || user.reviewCount;
      user.location = u.location || user.location;
      user.bio = u.bio || user.bio;
      user.specialties = u.specialties || user.specialties;
      user.skills = u.skills || user.skills;
      user.isDemo = true;
      await user.save();
      console.log(`Updated provider profile: ${u.name} (${u.email}) [${u.category || u.role}]`);
    } else {
      user = await User.create(u);
      console.log(`Created provider: ${u.name} (${u.email}) [${u.category || u.role}]`);
    }

    if (u.email === 'demo.customer@supportflow.dev') demoCustomer = user;
    if (u.email === 'demo.agent@supportflow.dev') demoAgent = user;
  }

  // 2. Seed Knowledge Base Articles
  for (const kb of DEFAULT_KB_ARTICLES) {
    const exists = await KnowledgeBase.findOne({ sourceCode: kb.sourceCode });
    if (!exists) {
      await KnowledgeBase.create(kb);
      console.log(`Created Knowledge Base article: ${kb.sourceCode} - ${kb.title}`);
    } else {
      await KnowledgeBase.updateOne({ sourceCode: kb.sourceCode }, kb);
      console.log(`Updated Knowledge Base article: ${kb.sourceCode}`);
    }
  }

  // 3. Seed sample bookings if none exist for demo customer
  if (demoCustomer && demoAgent) {
    const existingBookings = await Booking.find({ customer: demoCustomer._id });
    if (existingBookings.length === 0) {
      console.log('Seeding initial demo bookings for customer...');
      await Booking.create([
        {
          bookingNumber: 'BK-784912',
          customer: demoCustomer._id,
          agent: demoAgent._id,
          serviceCategory: 'Gardening',
          serviceTitle: 'Lawn Rejuvenation & Drip Sprinkler Setup',
          bookingDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          timeSlot: '09:00 AM - 11:00 AM',
          location: 'Gulberg III, Main Boulevard, Lahore',
          notes: 'Front yard grass needs dethatching and new automatic drip lines connected to garden tap.',
          pricePerHour: 1800,
          status: 'Accepted',
          urgency: 'Medium',
          acceptedAt: new Date()
        },
        {
          bookingNumber: 'BK-391024',
          customer: demoCustomer._id,
          agent: demoAgent._id,
          serviceCategory: 'Gardening',
          serviceTitle: 'Tree Pruning & Hedge Sculpting',
          bookingDate: new Date(Date.now() - 48 * 60 * 60 * 1000),
          timeSlot: '02:00 PM - 04:00 PM',
          location: 'Gulberg III, Lahore',
          notes: 'Tall palm trees trimming and ornamental ficus box hedges sculpting.',
          pricePerHour: 1800,
          status: 'Completed',
          urgency: 'Low',
          acceptedAt: new Date(Date.now() - 47 * 60 * 60 * 1000),
          completedAt: new Date(Date.now() - 44 * 60 * 60 * 1000),
          resolutionNote: 'Successfully trimmed 4 palm trees, sculpted 60ft ficus perimeter hedge, cleared all organic debris into municipal compost bags.'
        }
      ]);
      console.log('Created 2 demo service bookings.');
    }
  }

  // 4. Backfill tickets with defaults if missing
  const ticketsToUpdate = await Ticket.find({
    $or: [
      { sentiment: { $exists: false } },
      { slaDeadline: null }
    ]
  });

  for (const t of ticketsToUpdate) {
    if (!t.sentiment) t.sentiment = 'Neutral';
    if (!t.urgencyScore) t.urgencyScore = t.priority === 'High' ? 8 : t.priority === 'Low' ? 3 : 5;
    if (!t.aiConfidence) t.aiConfidence = 85;
    if (!t.slaDeadline) {
      const hours = t.priority === 'High' ? 4 : t.priority === 'Low' ? 48 : 24;
      t.slaDeadline = new Date(t.createdAt.getTime() + hours * 60 * 60 * 1000);
    }
    await t.save();
  }

  await mongoose.disconnect();
  console.log('✅ Database seeding & provider catalog initialization completed successfully.');
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});