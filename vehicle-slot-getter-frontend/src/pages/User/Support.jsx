import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { feedbackService } from '../../services/api';
import '../../styles/Support.css';

const Support = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        subject: '',
        message: '',
        rating: 5
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.subject || !formData.message) {
            setError('Please fill in all fields');
            return;
        }

        try {
            setLoading(true);
            setError('');
            const response = await feedbackService.submitFeedback(formData);
            if (response.data.success) {
                setSuccess(true);
                setFormData({ subject: '', message: '', rating: 5 });
            }
        } catch (err) {
            console.error('Feedback Error:', err);
            setError('Failed to submit feedback. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="support-page">
            <div className="support-header">
                <button className="back-btn" onClick={() => navigate('/home')}>← Back</button>
                <h1>Support & Feedback</h1>
                <p>How can we help you today?</p>
            </div>

            <div className="support-container">
                {success ? (
                    <div className="success-card">
                        <div className="success-icon">✨</div>
                        <h2>Thank You!</h2>
                        <p>Your feedback has been received. Our team will look into it.</p>
                        <button onClick={() => setSuccess(false)}>Send Another</button>
                    </div>
                ) : (
                    <form className="support-form" onSubmit={handleSubmit}>
                        <div className="rating-section">
                            <label>Rate your experience</label>
                            <div className="stars">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <span
                                        key={s}
                                        className={`star ${formData.rating >= s ? 'active' : ''}`}
                                        onClick={() => setFormData({ ...formData, rating: s })}
                                    >
                                        ★
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Subject</label>
                            <input
                                type="text"
                                placeholder="What is this about?"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Message</label>
                            <textarea
                                rows="5"
                                placeholder="Describe your issue or feedback..."
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            ></textarea>
                        </div>

                        {error && <div className="error-msg">{error}</div>}

                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? 'Submitting...' : 'Send Feedback'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Support;
