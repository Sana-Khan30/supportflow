const express = require('express');
const router = express.Router();
const {
  createTicket,
  getMyTickets,
  getTicketById,
  getAllTickets,
  assignToMe,
  updateTicket,
  overrideTriage,
  submitTicketReview,
  getCopilotDraft,
  getDuplicates,
  getKnowledgeBase,
  deleteTicket
} = require('../controllers/ticketController');
const { protect, authorize } = require('../middleware/auth');

// Knowledge base lookup (agent accessible)
router.get('/knowledge/articles', protect, authorize('agent'), getKnowledgeBase);

router.post('/', protect, authorize('customer'), createTicket);
router.get('/my', protect, authorize('customer'), getMyTickets);
router.get('/', protect, authorize('agent'), getAllTickets);
router.get('/:id', protect, getTicketById);
router.patch('/:id/assign', protect, authorize('agent'), assignToMe);
router.patch('/:id/triage', protect, authorize('agent'), overrideTriage);
router.post('/:id/review', protect, authorize('customer'), submitTicketReview);
router.post('/:id/copilot', protect, authorize('agent'), getCopilotDraft);
router.get('/:id/duplicates', protect, getDuplicates);
router.patch('/:id', protect, authorize('agent'), updateTicket);
router.delete('/:id', protect, authorize('customer'), deleteTicket);

module.exports = router;