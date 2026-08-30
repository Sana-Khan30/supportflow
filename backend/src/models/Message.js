const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole: { type: String, enum: ['customer', 'agent'], required: true },
  text: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);