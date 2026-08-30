const Message = require('../models/Message');
const Ticket = require('../models/Ticket');

const canAccessTicket = (ticket, user) => {
  if (user.role === 'customer') return ticket.customer.toString() === user.id;
  return true;
};

exports.getMessages = async (req, res) => {
  const ticket = await Ticket.findById(req.params.ticketId);
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
  if (!canAccessTicket(ticket, req.user)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const messages = await Message.find({ ticket: req.params.ticketId }).sort({ createdAt: 1 });
  res.json(messages);
};

exports.sendMessage = async (req, res) => {
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

  const message = await Message.create({
    ticket: ticket._id,
    sender: req.user.id,
    senderRole: req.user.role,
    text: text.trim()
  });

  res.status(201).json(message);
};