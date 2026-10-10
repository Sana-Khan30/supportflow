const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingNumber: { type: String, default: () => `BK-${Math.floor(100000 + Math.random() * 900000)}` },
  ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', default: null },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Provider / Specialist
  
  serviceCategory: { type: String, default: 'General' },
  serviceTitle: { type: String, default: 'Standard Service Session' },
  bookingDate: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
  timeSlot: { type: String, default: '10:00 AM - 12:00 PM' },
  location: { type: String, default: 'On-site / Customer Location' },
  notes: { type: String, default: '' },
  pricePerHour: { type: Number, default: 1500 },
  
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected', 'In Progress', 'Completed'],
    default: 'Pending'
  },
  urgency: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  resolutionNote: { type: String, default: '' },
  acceptedAt: { type: Date, default: null },
  rejectedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);