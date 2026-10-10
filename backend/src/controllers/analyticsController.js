const Ticket = require('../models/Ticket');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const User = require('../models/User');

const STATUSES = ['New', 'Assigned', 'In Progress', 'Resolved'];
const PRIORITIES = ['Low', 'Medium', 'High'];
const SENTIMENTS = ['Frustrated', 'Neutral', 'Positive', 'Urgent'];

exports.getOverview = async (req, res) => {
  if (req.user.role !== 'agent') {
    return res.status(403).json({ message: 'Forbidden: agents only' });
  }

  const demoScope = !!req.user.isDemo;

  const agents = await User.find({ role: 'agent', isDemo: demoScope }).select('name _id');
  const agentIds = agents.map((a) => a._id.toString());

  const [tickets, reviews] = await Promise.all([
    Ticket.find({ isDemo: demoScope }).select('status priority category sentiment urgencyScore createdAt resolvedAt slaDeadline agent'),
    Review.find({ agent: { $in: agentIds } }).select('agent rating')
  ]);

  const byStatus = STATUSES.map((s) => ({
    name: s,
    value: tickets.filter((t) => t.status === s).length
  }));

  const byPriority = PRIORITIES.map((p) => ({
    name: p,
    value: tickets.filter((t) => t.priority === p).length
  }));

  const bySentiment = SENTIMENTS.map((s) => ({
    name: s,
    value: tickets.filter((t) => (t.sentiment || 'Neutral') === s).length
  }));

  const categoryCounts = {};
  tickets.forEach((t) => {
    const cat = t.category || 'General';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });
  const byCategory = Object.entries(categoryCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const resolved = tickets.filter((t) => t.resolvedAt);
  const avgResolutionHours = resolved.length
    ? resolved.reduce((sum, t) => sum + (new Date(t.resolvedAt) - new Date(t.createdAt)), 0) /
      resolved.length /
      (1000 * 60 * 60)
    : null;

  // SLA Compliance Calculation
  const now = new Date();
  let slaCompliant = 0;
  let slaBreached = 0;

  tickets.forEach((t) => {
    if (t.slaDeadline) {
      if (t.status === 'Resolved') {
        if (new Date(t.resolvedAt) <= new Date(t.slaDeadline)) {
          slaCompliant++;
        } else {
          slaBreached++;
        }
      } else {
        if (now <= new Date(t.slaDeadline)) {
          slaCompliant++;
        } else {
          slaBreached++;
        }
      }
    } else {
      slaCompliant++;
    }
  });

  const totalSlaTracked = slaCompliant + slaBreached;
  const slaAdherenceRate = totalSlaTracked > 0 ? Math.round((slaCompliant / totalSlaTracked) * 100) : 100;

  // Tickets created per day, last 14 days
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  const ticketsPerDay = days.map((d) => {
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const count = tickets.filter((t) => {
      const created = new Date(t.createdAt);
      return created >= d && created < next;
    }).length;
    return { date: d.toISOString().slice(5, 10), value: count };
  });

  // Per-agent leaderboard
  const agentStats = agents.map((a) => {
    const resolvedByAgent = tickets.filter(
      (t) => t.status === 'Resolved' && t.agent && t.agent.toString() === a._id.toString()
    ).length;
    const agentReviews = reviews.filter((r) => r.agent.toString() === a._id.toString());
    const avgRating = agentReviews.length
      ? agentReviews.reduce((s, r) => s + r.rating, 0) / agentReviews.length
      : null;
    return { name: a.name, resolved: resolvedByAgent, avgRating, reviewCount: agentReviews.length };
  }).sort((a, b) => b.resolved - a.resolved);

  res.json({
    totals: {
      tickets: tickets.length,
      resolved: resolved.length,
      resolutionRate: tickets.length ? Math.round((resolved.length / tickets.length) * 100) : 0,
      avgResolutionHours: avgResolutionHours !== null ? Math.round(avgResolutionHours * 10) / 10 : null,
      avgRating: reviews.length
        ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
        : null,
      slaAdherenceRate,
      slaBreached
    },
    byStatus,
    byPriority,
    bySentiment,
    byCategory,
    ticketsPerDay,
    agentStats
  });
};