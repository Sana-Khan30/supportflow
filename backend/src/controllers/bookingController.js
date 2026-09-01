const Booking = require('../models/Booking');
const Ticket = require('../models/Ticket');
const User = require('../models/User');

const ALLOWED_URGENCY = ['Low', 'Medium', 'High'];

const canAccessBooking = (booking, user) => {
  const customerId = booking.customer._id ? booking.customer._id.toString() : booking.customer.toString();
  const agentId = booking.agent._id ? booking.agent._id.toString() : booking.agent.toString();
  if (user.role === 'customer') return customerId === user.id;
  return agentId === user.id;
};

// GET /api/bookings/suggested/:ticketId — AI-category-based agent matching
exports.getSuggestedAgents = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (ticket.customer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    let agents = await User.find({ role: 'agent', skills: ticket.category })
      .select('name email skills');

    if (agents.length === 0) {
      agents = await User.find({ role: 'agent' }).select('name email skills').limit(5);
    }

    res.json(agents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/bookings
exports.createBooking = async (req, res) => {
  try {
    const { ticketId, agentId, urgency } = req.body;
    if (!ticketId || !agentId) {
      return res.status(400).json({ message: 'ticketId and agentId required' });
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (ticket.customer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const agent = await User.findById(agentId);
    if (!agent || agent.role !== 'agent') {
      return res.status(400).json({ message: 'Invalid agent selected' });
    }

    if (urgency && !ALLOWED_URGENCY.includes(urgency)) {
      return res.status(400).json({ message: 'Invalid urgency' });
    }

    const booking = await Booking.create({
      ticket: ticket._id,
      customer: req.user.id,
      agent: agent._id,
      urgency: urgency || 'Medium'
    });

    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/bookings/my
exports.getMyBookings = async (req, res) => {
  const bookings = await Booking.find({ customer: req.user.id })
    .populate('agent', 'name email')
    .populate('ticket', 'ticketNumber subject category')
    .sort({ createdAt: -1 });
  res.json(bookings);
};

// GET /api/bookings/assigned
exports.getAssignedBookings = async (req, res) => {
  const bookings = await Booking.find({ agent: req.user.id })
    .populate('customer', 'name email')
    .populate('ticket', 'ticketNumber subject description category')
    .sort({ createdAt: -1 });
  res.json(bookings);
};

// GET /api/bookings/:id
exports.getBookingById = async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('agent', 'name email')
    .populate('customer', 'name email')
    .populate('ticket', 'ticketNumber subject description category aiSummary');
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (!canAccessBooking(booking, req.user)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  res.json(booking);
};

// PATCH /api/bookings/:id/accept
exports.acceptBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (booking.agent.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  if (booking.status !== 'Pending') {
    return res.status(400).json({ message: `Cannot accept a booking with status ${booking.status}` });
  }

  booking.status = 'Accepted';
  booking.acceptedAt = new Date();
  await booking.save();
  res.json(booking);
};

// PATCH /api/bookings/:id/reject
exports.rejectBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (booking.agent.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  if (booking.status !== 'Pending') {
    return res.status(400).json({ message: `Cannot reject a booking with status ${booking.status}` });
  }

  booking.status = 'Rejected';
  booking.rejectedAt = new Date();
  await booking.save();
  res.json(booking);
};

// PATCH /api/bookings/:id/urgency
exports.setUrgency = async (req, res) => {
  const { urgency } = req.body;
  if (!ALLOWED_URGENCY.includes(urgency)) {
    return res.status(400).json({ message: 'Invalid urgency' });
  }

  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (booking.agent.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  if (['Rejected', 'Completed'].includes(booking.status)) {
    return res.status(400).json({ message: `Cannot modify a ${booking.status.toLowerCase()} booking` });
  }

  booking.urgency = urgency;
  await booking.save();
  res.json(booking);
};

// PATCH /api/bookings/:id/status
exports.updateStatus = async (req, res) => {
  const { status, resolutionNote } = req.body;
  if (!['In Progress', 'Completed'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (booking.agent.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  if (['Rejected', 'Completed'].includes(booking.status)) {
    return res.status(400).json({ message: `Cannot modify a ${booking.status.toLowerCase()} booking` });
  }
  if (status === 'In Progress' && booking.status !== 'Accepted') {
    return res.status(400).json({ message: 'Booking must be Accepted before moving to In Progress' });
  }
  if (status === 'Completed' && booking.status !== 'In Progress') {
    return res.status(400).json({ message: 'Booking must be In Progress before it can be Completed' });
  }

  booking.status = status;
  if (status === 'Completed') {
    booking.completedAt = new Date();
    if (resolutionNote) booking.resolutionNote = resolutionNote;
  }
  await booking.save();
  res.json(booking);
};