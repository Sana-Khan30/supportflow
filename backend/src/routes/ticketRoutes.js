const express = require('express');
const router = express.Router();
const {
  createTicket, getMyTickets, getTicketById,
  getAllTickets, assignToMe, updateTicket
} = require('../controllers/ticketController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('customer'), createTicket);
router.get('/my', protect, authorize('customer'), getMyTickets);
router.get('/', protect, authorize('agent'), getAllTickets);
router.get('/:id', protect, getTicketById);
router.patch('/:id/assign', protect, authorize('agent'), assignToMe);
router.patch('/:id', protect, authorize('agent'), updateTicket);

module.exports = router;