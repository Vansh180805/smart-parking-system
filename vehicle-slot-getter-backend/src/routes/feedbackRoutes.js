const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { authMiddleware } = require('../middleware/authMiddleware');

// User can submit feedback
router.post('/', authMiddleware(), feedbackController.submitFeedback);

// Admin routes
router.get('/all', authMiddleware(['admin']), feedbackController.getAllFeedback);
router.put('/:id', authMiddleware(['admin']), feedbackController.updateFeedbackStatus);

module.exports = router;
