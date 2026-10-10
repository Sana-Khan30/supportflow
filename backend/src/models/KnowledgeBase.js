const mongoose = require('mongoose');

const knowledgeBaseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  content: { type: String, required: true },
  tags: [{ type: String }],
  sourceCode: { type: String, required: true }, // e.g. "KB-REF-101", "POL-BILL-02"
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('KnowledgeBase', knowledgeBaseSchema);
