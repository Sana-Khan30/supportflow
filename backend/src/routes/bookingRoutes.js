const express = require('express');
const router = express.Router();
const {
  createBooking, getMyBookings, getAssignedBookings,
  getSuggestedAgents, getBookingById,
  acceptBooking, rejectBooking, setUrgency, updateStatus
} = require('../controllers/bookingController');
const { createReview, getMyReviews, getReviewForBooking } = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('customer'), createBooking);
router.get('/my', protect, authorize('customer'), getMyBookings);
router.get('/assigned', protect, authorize('agent'), getAssignedBookings);
router.get('/reviews/mine', protect, authorize('agent'), getMyReviews);
router.get('/suggested/:ticketId', protect, authorize('customer'), getSuggestedAgents);
router.get('/:id', protect, getBookingById);
router.post('/:id/review', protect, authorize('customer'), createReview);
router.get('/:id/review', protect, authorize('customer', 'agent'), getReviewForBooking);
router.patch('/:id/accept', protect, authorize('agent'), acceptBooking);
router.patch('/:id/reject', protect, authorize('agent'), rejectBooking);
router.patch('/:id/urgency', protect, authorize('agent'), setUrgency);
router.patch('/:id/status', protect, authorize('agent'), updateStatus);

module.exports = router;