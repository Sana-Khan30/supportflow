const Ticket = require('../models/Ticket');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Message = require('../models/Message');
const KnowledgeBase = require('../models/KnowledgeBase');
const generateTicketNumber = require('../utils/generateTicketNumber');
const { triageTicket, generateGroundedCopilotDraft, detectDuplicates } = require('../services/aiService');
const { broadcastToTicket, broadcastToAgents, notifyUser } = require('../sockets');

const ALLOWED_STATUSES = ['New', 'Assigned', 'In Progress', 'Resolved'];
const ALLOWED_PRIORITIES = ['Low', 'Medium', 'High'];
const ALLOWED_SENTIMENTS = ['Frustrated', 'Neutral', 'Positive', 'Urgent'];

const calculateSlaDeadline = (priority) => {
  const now = new Date();
  if (priority === 'High') {
    return new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours
  } else if (priority === 'Low') {
    return new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours
  }
  return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours default for Medium
};

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
    const triageData = aiResult.data;
    const finalCategory = category || triageData.category || 'General';
    const finalPriority = triageData.priority || 'Medium';
    const slaDeadline = calculateSlaDeadline(finalPriority);

    const initialActivity = [
      {
        action: 'CREATED',
        performedBy: req.user.id,
        performerName: req.user.name || 'Customer',
        performerRole: req.user.role || 'customer',
        details: 'Ticket submitted via Customer Portal',
        timestamp: new Date()
      },
      {
        action: 'AI_TRIAGED',
        performerName: 'SupportFlow AI',
        performerRole: 'system',
        details: `Auto-classified: Category "${finalCategory}", Priority "${finalPriority}", Sentiment "${triageData.sentiment}" (Confidence: ${triageData.confidence}%)`,
        timestamp: new Date()
      }
    ];

    const ticket = await Ticket.create({
      ticketNumber,
      customer: req.user.id,
      subject,
      description,
      category: finalCategory,
      priority: finalPriority,
      sentiment: triageData.sentiment || 'Neutral',
      intent: triageData.intent || 'General Inquiry',
      urgencyScore: triageData.urgencyScore || 5,
      aiConfidence: triageData.confidence || 85,
      keyPoints: triageData.keyPoints || [subject],
      suggestedAction: triageData.suggestedAction || 'Review issue and assign to agent.',
      isTriagedByAI: true,
      triagedAt: new Date(),
      slaDeadline,
      aiSummary: triageData.summary || subject,
      aiRaw: aiResult,
      activityLog: initialActivity,
      isDemo: !!req.user.isDemo,
    });

    broadcastToAgents('ticket_created', ticket, ticket.isDemo);

    const agents = await User.find({ role: 'agent', isDemo: !!req.user.isDemo }).select('_id');
    await Promise.all(
      agents.map(async (agent) => {
        const notification = await Notification.create({
          user: agent._id,
          type: 'new_ticket',
          ticket: ticket._id,
          text: `New ${ticket.priority} priority ticket #${ticket.ticketNumber}: ${ticket.subject}`,
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
    const tickets = await Ticket.find({ customer: req.user.id })
      .populate('agent', 'name email')
      .sort({ createdAt: -1 });
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
    if (Boolean(ticket.isDemo) !== Boolean(req.user.isDemo)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    ticket.agent = req.user.id;
    if (ticket.status === 'New') ticket.status = 'Assigned';

    ticket.activityLog.push({
      action: 'ASSIGNED',
      performedBy: req.user.id,
      performerName: req.user.name || 'Agent',
      performerRole: 'agent',
      details: `Claimed and assigned to ${req.user.name || 'Support Specialist'}`,
      timestamp: new Date()
    });

    await ticket.save();
    await ticket.populate('agent', 'name email');
    await ticket.populate('customer', 'name email');

    broadcastToTicket(ticket._id, 'ticket_updated', ticket);
    broadcastToAgents('ticket_updated', ticket, ticket.isDemo);

    const notification = await Notification.create({
      user: ticket.customer,
      type: 'assigned',
      ticket: ticket._id,
      text: `Specialist ${req.user.name || 'Support Specialist'} has taken up your ticket #${ticket.ticketNumber}.`,
    });
    notifyUser(ticket.customer, notification);

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.overrideTriage = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (req.user.role !== 'agent') return res.status(403).json({ message: 'Agents only' });

    const { category, priority, sentiment, intent, suggestedAction } = req.body;
    const changeNotes = [];

    if (category && category !== ticket.category) {
      changeNotes.push(`Category: "${ticket.category}" → "${category}"`);
      ticket.category = category;
    }
    if (priority && ALLOWED_PRIORITIES.includes(priority) && priority !== ticket.priority) {
      changeNotes.push(`Priority: "${ticket.priority}" → "${priority}"`);
      ticket.priority = priority;
      ticket.slaDeadline = calculateSlaDeadline(priority);
    }
    if (sentiment && ALLOWED_SENTIMENTS.includes(sentiment) && sentiment !== ticket.sentiment) {
      changeNotes.push(`Sentiment: "${ticket.sentiment}" → "${sentiment}"`);
      ticket.sentiment = sentiment;
    }
    if (intent) ticket.intent = intent;
    if (suggestedAction) ticket.suggestedAction = suggestedAction;

    ticket.isTriagedByAI = false;

    ticket.activityLog.push({
      action: 'TRIAGE_OVERRIDE',
      performedBy: req.user.id,
      performerName: req.user.name || 'Agent',
      performerRole: 'agent',
      details: changeNotes.length > 0 ? `Agent adjusted triage: ${changeNotes.join(', ')}` : 'Agent verified AI classifications',
      timestamp: new Date()
    });

    await ticket.save();
    await ticket.populate('agent', 'name email');
    await ticket.populate('customer', 'name email');

    broadcastToTicket(ticket._id, 'ticket_updated', ticket);
    broadcastToAgents('ticket_updated', ticket, ticket.isDemo);

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

    const { category, priority, aiSummary, status, resolutionNote, sentiment } = req.body;
    let statusChanged = false;

    if (category) ticket.category = category;
    if (aiSummary) ticket.aiSummary = aiSummary;
    if (sentiment && ALLOWED_SENTIMENTS.includes(sentiment)) ticket.sentiment = sentiment;

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
        ticket.activityLog.push({
          action: 'STATUS_CHANGE',
          performedBy: req.user.id,
          performerName: req.user.name || 'Agent',
          performerRole: 'agent',
          details: `Status transitioned from "${ticket.status}" to "${status}"${status === 'Resolved' ? ` (Resolution Note: ${resolutionNote || ticket.resolutionNote})` : ''}`,
          timestamp: new Date()
        });
      }
      ticket.status = status;
      if (status === 'Resolved') {
        ticket.resolvedAt = new Date();
      }
    }

    if (resolutionNote) ticket.resolutionNote = resolutionNote;

    await ticket.save();
    await ticket.populate('agent', 'name email');
    await ticket.populate('customer', 'name email');

    broadcastToTicket(ticket._id, 'ticket_updated', ticket);
    broadcastToAgents('ticket_updated', ticket, ticket.isDemo);

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

// Direct Customer Review / Rating on Resolved Ticket
exports.submitTicketReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Valid rating (1 to 5) required' });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (ticket.customer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (ticket.status !== 'Resolved') {
      return res.status(400).json({ message: 'Can only rate resolved tickets' });
    }

    ticket.customerReview = {
      rating: Number(rating),
      comment: (comment || '').trim(),
      reviewedAt: new Date()
    };

    ticket.activityLog.push({
      action: 'CUSTOMER_REVIEW',
      performedBy: req.user.id,
      performerName: req.user.name || 'Customer',
      performerRole: 'customer',
      details: `Customer submitted CSAT rating: ${rating} ★${comment ? ` ("${comment.trim().slice(0, 60)}")` : ''}`,
      timestamp: new Date()
    });

    await ticket.save();

    // If assigned agent exists, also record or update Review model
    if (ticket.agent) {
      try {
        const existingReview = await Review.findOne({ ticket: ticket._id });
        if (existingReview) {
          existingReview.rating = Number(rating);
          existingReview.comment = (comment || '').trim();
          await existingReview.save();
        } else {
          await Review.create({
            ticket: ticket._id,
            booking: null,
            customer: req.user.id,
            agent: ticket.agent,
            rating: Number(rating),
            comment: (comment || '').trim()
          });
        }
      } catch (err) {
        console.warn('Review collection sync warning:', err.message);
      }
    }

    broadcastToTicket(ticket._id, 'ticket_updated', ticket);

    res.json({ message: 'Review recorded successfully', review: ticket.customerReview });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCopilotDraft = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id).populate('customer', 'name email');
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (req.user.role !== 'agent') return res.status(403).json({ message: 'Agents only' });

    const { agentInstruction } = req.body || {};

    const [messages, knowledgeArticles] = await Promise.all([
      Message.find({ ticket: ticket._id }).sort({ createdAt: 1 }),
      KnowledgeBase.find({ isActive: true }).limit(6)
    ]);

    const copilotResult = await generateGroundedCopilotDraft(
      ticket,
      messages,
      knowledgeArticles,
      agentInstruction
    );

    res.json(copilotResult);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDuplicates = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    const candidates = await Ticket.find({
      _id: { $ne: ticket._id },
      isDemo: Boolean(ticket.isDemo)
    })
      .select('ticketNumber subject description category priority status createdAt')
      .sort({ createdAt: -1 })
      .limit(30);

    const duplicates = detectDuplicates(ticket, candidates);
    res.json({ count: duplicates.length, duplicates });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getKnowledgeBase = async (req, res) => {
  try {
    const { query, category } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } }
      ];
    }
    const articles = await KnowledgeBase.find(filter).sort({ title: 1 });
    res.json(articles);
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