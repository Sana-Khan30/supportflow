const Message = require('../models/Message');
const Ticket = require('../models/Ticket');
const Notification = require('../models/Notification');
const { generateReply } = require('../services/aiService');
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

    const messages = await Message.find({ ticket: req.params.ticketId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'Message text required' });

    const ticket = await Ticket.findById(req.params.ticketId);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (!canAccessTicket(ticket, req.user)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (ticket.status === 'Resolved') {
      return res.status(400).json({ message: 'Cannot message on a resolved ticket' });
    }

    // 1. Create and persist user message
    const message = await Message.create({
      ticket: ticket._id,
      sender: req.user.id,
      senderRole: req.user.role,
      text: text.trim(),
    });

    // 2. Broadcast live message to ticket room
    broadcastToTicket(ticket._id, 'new_message', message);

    // 3. Notify recipient in real-time
    const recipientId =
      req.user.role === 'customer'
        ? ticket.agent
        : ticket.customer;

    if (recipientId) {
      // Fields match the Notification schema (user, type, ticket, text)
      const notification = await Notification.create({
        user: recipientId,
        type: 'new_message',
        ticket: ticket._id,
        text: `New message on #${ticket.ticketNumber}: ${text.trim().slice(0, 80)}`,
      });
      notifyUser(recipientId, notification);
    }

    // Return HTTP response immediately
    res.status(201).json(message);

    // 4. Auto-reply: trigger when the CUSTOMER sends a message (asynchronous)
    if (req.user.role === 'customer') {
      (async () => {
        try {
          // Emit actual AI typing indicator event to ticket room
          broadcastToTicket(ticket._id, 'ai_typing', { typing: true });

          const priorMessages = await Message.find({ ticket: ticket._id }).sort({ createdAt: 1 });
          const aiResult = await generateReply(ticket, priorMessages, text.trim());

          const aiMessage = await Message.create({
            ticket: ticket._id,
            sender: null,
            senderRole: 'ai',
            text: aiResult.text,
          });

          // Turn off AI typing indicator and broadcast AI message
          broadcastToTicket(ticket._id, 'ai_typing', { typing: false });
          broadcastToTicket(ticket._id, 'new_message', aiMessage);
        } catch (err) {
          console.error('Auto-reply failed:', err.message);
          broadcastToTicket(ticket._id, 'ai_typing', { typing: false });
        }
      })();
    }
  } catch (err) {
    console.error('sendMessage error:', err);
    res.status(500).json({ message: err.message });
  }
};