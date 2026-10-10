const Message = require('../models/Message');
const Ticket = require('../models/Ticket');
const Notification = require('../models/Notification');
const { generateGroundedCopilotDraft } = require('../services/aiService');
const { broadcastToTicket, notifyUser } = require('../sockets');

const canAccessTicket = (ticket, user) => {
  if (user.role === 'customer') return ticket.customer.toString() === user.id;
  return true;
};

exports.getMessages = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (!canAccessTicket(ticket, req.user)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const query = { ticket: req.params.ticketId };
    // Customers NEVER receive internal notes
    if (req.user.role === 'customer') {
      query.isInternal = { $ne: true };
    }

    const messages = await Message.find(query)
      .populate('sender', 'name role')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { text, isInternal } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'Message text required' });

    const ticket = await Ticket.findById(req.params.ticketId);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (!canAccessTicket(ticket, req.user)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (ticket.status === 'Resolved') {
      return res.status(400).json({ message: 'Cannot message on a resolved ticket' });
    }

    // Only agents are allowed to post internal notes
    const isInternalNote = Boolean(isInternal && req.user.role === 'agent');

    // 1. Create and persist user message
    const message = await Message.create({
      ticket: ticket._id,
      sender: req.user.id,
      senderRole: req.user.role,
      text: text.trim(),
      isInternal: isInternalNote
    });

    await message.populate('sender', 'name role');

    // If it's an internal note, log it into ticket activity
    if (isInternalNote) {
      ticket.activityLog.push({
        action: 'INTERNAL_NOTE',
        performedBy: req.user.id,
        performerName: req.user.name || 'Agent',
        performerRole: 'agent',
        details: `Private internal note: "${text.trim().slice(0, 70)}${text.trim().length > 70 ? '...' : ''}"`,
        timestamp: new Date()
      });
      await ticket.save();
    }

    // 2. Broadcast live message to ticket room
    // Note: socket room broadcasts the message. We attach isInternal flag.
    broadcastToTicket(ticket._id, 'new_message', message);

    // 3. Notify recipient in real-time (only if not an internal note)
    if (!isInternalNote) {
      const recipientId =
        req.user.role === 'customer'
          ? ticket.agent
          : ticket.customer;

      if (recipientId) {
        const notification = await Notification.create({
          user: recipientId,
          type: 'new_message',
          ticket: ticket._id,
          text: `New message on #${ticket.ticketNumber}: ${text.trim().slice(0, 80)}`,
        });
        notifyUser(recipientId, notification);
      }
    }

    res.status(201).json(message);
  } catch (err) {
    console.error('sendMessage error:', err);
    res.status(500).json({ message: err.message });
  }
};