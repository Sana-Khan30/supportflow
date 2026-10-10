const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  senderRole: { type: String, enum: ['customer', 'agent', 'ai'], required: true },
  text: { type: String, required: true },
  // Internal staff-only notes (invisible to customers)
  isInternal: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);