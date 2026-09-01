const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
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