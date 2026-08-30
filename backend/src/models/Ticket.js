const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketNumber: { type: String, required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, default: 'General' },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  status: { type: String, enum: ['New', 'Assigned', 'In Progress', 'Resolved'], default: 'New' },
  aiSummary: { type: String, default: '' },
  aiRaw: { type: Object, default: null },
  resolutionNote: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);