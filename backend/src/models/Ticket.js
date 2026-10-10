const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  performerName: { type: String, default: 'System' },
  performerRole: { type: String, default: 'system' },
  details: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
}, { _id: true });

const ticketSchema = new mongoose.Schema({
  ticketNumber: { type: String, required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, default: 'General' },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  status: { type: String, enum: ['New', 'Assigned', 'In Progress', 'Resolved'], default: 'New' },
  
  // Intelligent Multi-Dimensional AI Triage Fields
  sentiment: {
    type: String,
    enum: ['Frustrated', 'Neutral', 'Positive', 'Urgent'],
    default: 'Neutral'
  },
  intent: { type: String, default: 'General Inquiry' },
  urgencyScore: { type: Number, min: 1, max: 10, default: 5 },
  aiConfidence: { type: Number, min: 0, max: 100, default: 85 },
  keyPoints: [{ type: String }],
  suggestedAction: { type: String, default: 'Review ticket and assign to specialist' },
  isTriagedByAI: { type: Boolean, default: true },
  triagedAt: { type: Date, default: Date.now },
  slaDeadline: { type: Date, default: null },

  aiSummary: { type: String, default: '' },
  aiRaw: { type: Object, default: null },
  resolutionNote: { type: String, default: '' },
  resolvedAt: { type: Date, default: null },
  
  // Direct Customer CSAT Feedback on Resolution
  customerReview: {
    rating: { type: Number, min: 1, max: 5, default: null },
    comment: { type: String, default: '' },
    reviewedAt: { type: Date, default: null }
  },

  // Auditable Lifecycle History
  activityLog: [activityLogSchema],

  // Sandbox isolation flag
  isDemo: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);