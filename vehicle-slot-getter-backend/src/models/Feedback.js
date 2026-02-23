const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        subject: {
            type: String,
            required: [true, 'Please provide a subject'],
            trim: true,
        },
        message: {
            type: String,
            required: [true, 'Please provide a message'],
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
            default: 5,
        },
        status: {
            type: String,
            enum: ['pending', 'reviewed', 'resolved'],
            default: 'pending',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Feedback', FeedbackSchema);
