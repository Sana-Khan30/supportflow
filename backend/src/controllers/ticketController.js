const Ticket = require('../models/Ticket');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const User = require('../models/User');
const generateTicketNumber = require('../utils/generateTicketNumber');
const { triageTicket } = require('../services/aiService');
const { broadcastToTicket, broadcastToAgents, notifyUser } = require('../sockets');

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
      aiRaw: aiResult,
      isDemo: !!req.user.isDemo,
    });

    // Broadcast new ticket to agents room (live queue refresh) — scoped to the same demo/real world
    broadcastToAgents('ticket_created', ticket, ticket.isDemo);

    // Persist + push a real notification to every agent in the same world, so the bell has something to show
    const agents = await User.find({ role: 'agent', isDemo: !!req.user.isDemo }).select('_id');
    await Promise.all(
      agents.map(async (agent) => {
        const notification = await Notification.create({
          user: agent._id,
          type: 'new_ticket',
          ticket: ticket._id,
          text: `New ticket #${ticket.ticketNumber}: ${ticket.subject}`,
        });
        notifyUser(agent._id, notification);
      })
    );

    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ customer: req.user.id }).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('customer', 'name email')
      .populate('agent', 'name email');

    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    const customerId = ticket.customer._id ? ticket.customer._id.toString() : ticket.customer.toString();
    if (req.user.role === 'customer' && customerId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    // An agent may only open tickets on their own side of the demo/real boundary
    if (req.user.role === 'agent' && Boolean(ticket.isDemo) !== Boolean(req.user.isDemo)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllTickets = async (req, res) => {
  try {
    // Agent only ever sees tickets on their own side of the demo/real boundary
    const tickets = await Ticket.find({ isDemo: !!req.user.isDemo })
      .populate('customer', 'name email')
      .populate('agent', 'name email')
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.assignToMe = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (ticket.status === 'Resolved') {
      return res.status(400).json({ message: 'Cannot modify a resolved ticket' });
    }
    // Defense in depth: an agent can't assign a ticket outside their demo/real world,
    // even if they somehow reach this endpoint with the right ticket ID.
    if (Boolean(ticket.isDemo) !== Boolean(req.user.isDemo)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    ticket.agent = req.user.id;
    if (ticket.status === 'New') ticket.status = 'Assigned';
    await ticket.save();

    await ticket.populate('agent', 'name email');

    // Live real-time broadcast to ticket room and agent desk
    broadcastToTicket(ticket._id, 'ticket_updated', ticket);
    broadcastToAgents('ticket_updated', ticket, ticket.isDemo);

    // Notify customer in real-time — fields match the Notification schema (user, type, ticket, text)
    const notification = await Notification.create({
      user: ticket.customer,
      type: 'assigned',
      ticket: ticket._id,
      text: `A support agent (${req.user.name || 'Support Specialist'}) has taken up your ticket #${ticket.ticketNumber}.`,
    });
    notifyUser(ticket.customer, notification);

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    if (ticket.status === 'Resolved') {
      return res.status(400).json({ message: 'Cannot modify a resolved ticket' });
    }
    if (!ticket.agent || ticket.agent.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the assigned agent can modify this ticket' });
    }

    const { category, priority, aiSummary, status, resolutionNote } = req.body;
    let statusChanged = false;

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
      if (ticket.status !== status) {
        statusChanged = true;
      }
      ticket.status = status;
      // Stamp resolvedAt whenever the ticket transitions into Resolved (feeds analytics)
      if (status === 'Resolved') {
        ticket.resolvedAt = new Date();
      }
    }

    if (resolutionNote) ticket.resolutionNote = resolutionNote;

    await ticket.save();
    await ticket.populate('agent', 'name email');

    // Live real-time broadcast to ticket room and agents
    broadcastToTicket(ticket._id, 'ticket_updated', ticket);
    broadcastToAgents('ticket_updated', ticket, ticket.isDemo);

    // If status changed or resolved, notify customer — fields match the Notification schema
    if (statusChanged) {
      const isResolved = ticket.status === 'Resolved';
      const notification = await Notification.create({
        user: ticket.customer,
        type: 'status_change',
        ticket: ticket._id,
        text: isResolved
          ? `Ticket #${ticket.ticketNumber} resolved: ${ticket.resolutionNote || 'Issue addressed.'}`
          : `Ticket #${ticket.ticketNumber} status changed to: ${ticket.status}`,
      });
      notifyUser(ticket.customer, notification);
    }

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (ticket.customer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (ticket.status === 'Resolved') {
      return res.status(400).json({ message: 'Cannot delete a resolved ticket' });
    }
    const hasBooking = await Booking.exists({ ticket: ticket._id });
    if (hasBooking) {
      return res.status(400).json({ message: 'Cannot delete a ticket that has a booking' });
    }

    const ticketId = ticket._id;
    const wasDemo = ticket.isDemo;
    await ticket.deleteOne();

    broadcastToTicket(ticketId, 'ticket_deleted', { ticketId });
    broadcastToAgents('ticket_deleted', { ticketId }, wasDemo);

    res.json({ message: 'Ticket deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};