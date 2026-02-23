const Feedback = require('../models/Feedback');

// @desc    Submit new feedback/support request
// @route   POST /api/feedback
// @access  Private
exports.submitFeedback = async (req, res) => {
    try {
        const { subject, message, rating } = req.body;
        const { userId, name, email } = req.user;

        const feedback = await Feedback.create({
            userId,
            name,
            email,
            subject,
            message,
            rating,
        });

        res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
            data: feedback,
        });
    } catch (error) {
        console.error('Submit feedback error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

// @desc    Get all feedback (Admin only)
// @route   GET /api/feedback
// @access  Private/Admin
exports.getAllFeedback = async (req, res) => {
    try {
        const feedbacks = await Feedback.find()
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: feedbacks.length,
            data: feedbacks,
        });
    } catch (error) {
        console.error('Get all feedback error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

// @desc    Update feedback status (Admin only)
// @route   PUT /api/feedback/:id
// @access  Private/Admin
exports.updateFeedbackStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const feedback = await Feedback.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: 'Feedback not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Feedback status updated',
            feedback,
        });
    } catch (error) {
        console.error('Update feedback error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};
