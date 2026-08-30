const Ticket = require('../models/Ticket');
const generateTicketNumber = require('../utils/generateTicketNumber');
const { triageTicket } = require('../services/aiService');

const ALLOWED_STATUSES = ['New', 'Assigned', 'In Progress', 'Resolved'];
const ALLOWED_PRIORITIES = ['Low', 'Medium', 'High'];

exports.createTicket = async (req, res) => {
  try {
    const { subject, description, category } = req.body;
    if (!subject || !description) {
      return res.status(400).json({ message: 'Subject and description required' });
    }

    let ticketNumber;
    let exists = true;
    while (exists) {
      ticketNumber = generateTicketNumber();
      exists = await Ticket.findOne({ ticketNumber });
    }

    const aiResult = await triageTicket(subject, description);

    const ticket = await Ticket.create({
      ticketNumber,
      customer: req.user.id,
      subject,
      description,
      category: category || aiResult.data.category,
      priority: aiResult.data.priority,
      aiSummary: aiResult.data.summary,
      aiRaw: aiResult
    });

    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyTickets = async (req, res) => {
  const tickets = await Ticket.find({ customer: req.user.id }).sort({ createdAt: -1 });
  res.json(tickets);
};

exports.getTicketById = async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

  if (req.user.role === 'customer' && ticket.customer.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  res.json(ticket);
};

exports.getAllTickets = async (req, res) => {
  const tickets = await Ticket.find().sort({ createdAt: -1 });
  res.json(tickets);
};

exports.assignToMe = async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
  if (ticket.status === 'Resolved') {
    return res.status(400).json({ message: 'Cannot modify a resolved ticket' });
  }

  ticket.agent = req.user.id;
  if (ticket.status === 'New') ticket.status = 'Assigned';
  await ticket.save();
  res.json(ticket);
};

exports.updateTicket = async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

  if (ticket.status === 'Resolved') {
    return res.status(400).json({ message: 'Cannot modify a resolved ticket' });
  }
  if (!ticket.agent || ticket.agent.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Only the assigned agent can modify this ticket' });
  }

  const { category, priority, aiSummary, status, resolutionNote } = req.body;

  if (category) ticket.category = category;
  if (aiSummary) ticket.aiSummary = aiSummary;

  if (priority) {
    if (!ALLOWED_PRIORITIES.includes(priority)) {
      return res.status(400).json({ message: 'Invalid priority' });
    }
    ticket.priority = priority;
  }

  if (status) {
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    if (status === 'Resolved' && !resolutionNote && !ticket.resolutionNote) {
      return res.status(400).json({ message: 'Resolution note required to resolve ticket' });
    }
    ticket.status = status;
  }

  if (resolutionNote) ticket.resolutionNote = resolutionNote;

  await ticket.save();
  res.json(ticket);
};