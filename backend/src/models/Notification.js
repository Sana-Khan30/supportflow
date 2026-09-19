const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['new_ticket', 'new_message', 'status_change', 'assigned', 'booking_update'],
    required: true
  },
  ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', default: null },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
  text: { type: String, required: true },
  read: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
