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

// GET /api/bookings/providers — Public/Customer marketplace providers query
exports.getProviders = async (req, res) => {
  try {
    const { category, search, location } = req.query;
    const filter = { role: 'agent' };

    if (category && category !== 'All' && category !== 'All Services') {
      filter.category = new RegExp(`^${category}$`, 'i');
    }

    if (location && location !== 'All') {
      filter.location = new RegExp(location, 'i');
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: new RegExp(q, 'i') },
        { businessName: new RegExp(q, 'i') },
        { bio: new RegExp(q, 'i') },
        { category: new RegExp(q, 'i') },
        { specialties: new RegExp(q, 'i') }
      ];
    }

    const providers = await User.find(filter)
      .select('-password')
      .sort({ rating: -1, reviewCount: -1 });

    res.json(providers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/bookings/suggested/:ticketId — AI-category-based agent matching
exports.getSuggestedAgents = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (ticket.customer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const demoScope = !!req.user.isDemo;

    let agents = await User.find({ role: 'agent', skills: ticket.category, isDemo: demoScope })
      .select('name email businessName category hourlyRate rating reviewCount location avatar specialties');

    if (agents.length === 0) {
      agents = await User.find({ role: 'agent', isDemo: demoScope })
        .select('name email businessName category hourlyRate rating reviewCount location avatar specialties');
    }

    res.json(agents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/bookings — Supports both direct service appointments and ticket-linked bookings
exports.createBooking = async (req, res) => {
  try {
    const {
      ticketId,
      agentId,
      urgency,
      serviceCategory,
      serviceTitle,
      bookingDate,
      timeSlot,
      location,
      notes,
      pricePerHour
    } = req.body;

    if (!agentId) {
      return res.status(400).json({ message: 'Specialist / Provider ID (agentId) is required' });
    }

    let ticket = null;
    if (ticketId) {
      ticket = await Ticket.findById(ticketId);
      if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
      if (ticket.customer.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden: Ticket does not belong to you' });
      }
    }

    const agent = await User.findById(agentId);
    if (!agent || agent.role !== 'agent') {
      return res.status(400).json({ message: 'Invalid specialist or provider selected' });
    }

    if (urgency && !ALLOWED_URGENCY.includes(urgency)) {
      return res.status(400).json({ message: 'Invalid urgency' });
    }

    const booking = await Booking.create({
      ticket: ticket ? ticket._id : null,
      customer: req.user.id,
      agent: agent._id,
      serviceCategory: serviceCategory || agent.category || 'General',
      serviceTitle: serviceTitle || `${agent.category || 'General'} Service Appointment`,
      bookingDate: bookingDate ? new Date(bookingDate) : new Date(Date.now() + 24 * 60 * 60 * 1000),
      timeSlot: timeSlot || '10:00 AM - 12:00 PM',
      location: location || agent.location || 'Customer Address',
      notes: notes || '',
      pricePerHour: pricePerHour || agent.hourlyRate || 1500,
      urgency: urgency || 'Medium',
      status: 'Pending'
    });

    const populated = await Booking.findById(booking._id)
      .populate('agent', 'name email businessName category hourlyRate rating location avatar')
      .populate('customer', 'name email')
      .populate('ticket', 'ticketNumber subject category');

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/bookings/my
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ customer: req.user.id })
      .populate('agent', 'name email businessName category hourlyRate rating location avatar specialties')
      .populate('ticket', 'ticketNumber subject category status priority')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/bookings/assigned
exports.getAssignedBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ agent: req.user.id })
      .populate('customer', 'name email')
      .populate('ticket', 'ticketNumber subject description category priority status')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/bookings/:id
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('agent', 'name email businessName category hourlyRate rating location avatar specialties')
      .populate('customer', 'name email')
      .populate('ticket', 'ticketNumber subject description category priority status aiSummary');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (!canAccessBooking(booking, req.user)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/bookings/:id/accept
exports.acceptBooking = async (req, res) => {
  try {
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

    const populated = await Booking.findById(booking._id)
      .populate('agent', 'name email businessName category hourlyRate rating location')
      .populate('customer', 'name email');

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/bookings/:id/reject
exports.rejectBooking = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/bookings/:id/urgency
exports.setUrgency = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/bookings/:id/status
exports.updateStatus = async (req, res) => {
  try {
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

    const populated = await Booking.findById(booking._id)
      .populate('agent', 'name email businessName category hourlyRate rating location')
      .populate('customer', 'name email');

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};