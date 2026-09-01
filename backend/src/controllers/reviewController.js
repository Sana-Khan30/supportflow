const Review = require('../models/Review');
const Booking = require('../models/Booking');

// POST /api/bookings/:id/review
exports.createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be an integer from 1 to 5' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.customer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (booking.status !== 'Completed') {
      return res.status(400).json({ message: 'Can only review a completed task' });
    }

    const review = await Review.create({
      booking: booking._id,
      ticket: booking.ticket,
      customer: req.user.id,
      agent: booking.agent,
      rating,
      comment: comment || ''
    });

    res.status(201).json(review);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'This booking has already been reviewed' });
    }
    res.status(500).json({ message: err.message });
  }
};

// GET /api/bookings/reviews/mine — agent views their received reviews
exports.getMyReviews = async (req, res) => {
  const reviews = await Review.find({ agent: req.user.id })
    .populate('customer', 'name')
    .sort({ createdAt: -1 });
  res.json(reviews);
};

// GET /api/bookings/:id/review — check if this booking already has a review
exports.getReviewForBooking = async (req, res) => {
  const review = await Review.findOne({ booking: req.params.id });
  if (!review) return res.status(404).json({ message: 'No review yet' });
  res.json(review);
};