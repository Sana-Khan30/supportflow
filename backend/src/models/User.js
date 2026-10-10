const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'agent'], default: 'customer' },
  skills: { type: [String], default: [] },
  
  // Provider / Craftsman Marketplace Fields
  businessName: { type: String, default: '' },
  category: { type: String, default: 'General' }, // Gardening, Plumbing, Electrical, Carpentry, Cleaning, Painting, AC Repair
  hourlyRate: { type: Number, default: 1500 },
  location: { type: String, default: 'Lahore, Pakistan' },
  bio: { type: String, default: 'Certified professional craftsman delivering quality home services with precision.' },
  rating: { type: Number, default: 4.9 },
  reviewCount: { type: Number, default: 12 },
  available: { type: Boolean, default: true },
  experienceYears: { type: Number, default: 5 },
  specialties: [{ type: String }],
  avatar: { type: String, default: '' },

  // Demo account isolation flag
  isDemo: { type: Boolean, default: false }
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);