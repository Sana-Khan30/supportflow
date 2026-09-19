const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'agent'], default: 'customer' },
  skills: { type: [String], default: [] },
  // Marks the two fixed portfolio-demo accounts. Used everywhere to keep the
  // demo sandbox (tickets, agents, bookings, analytics) fully isolated from
  // real customer/agent data — never mixed in either direction.
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