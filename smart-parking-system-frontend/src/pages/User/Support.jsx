import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { feedbackService } from '../../services/api';
import { Sparkles, Star, LifeBuoy, Send, MessageSquare, Tag } from 'lucide-react';
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
                <div className="header-bg-glow" />
                <div className="header-content">
                    <div className="header-intro">
                        <div className="header-eyebrow">
                            <LifeBuoy size={12} /> SMART PARKING PREMIUM
                        </div>
                        <h1>Support & Feedback</h1>
                        <p>How can we help you today? Your feedback matters.</p>
                    </div>
                </div>
            </div>

            <div className="support-container">
                {success ? (
                    <div className="success-card">
                        <div className="success-icon"><Sparkles size={48} color="#8B5CF6" /></div>
                        <h2>Thank You!</h2>
                        <p>Your feedback has been received. Our team will look into it.</p>
                        <button className="action-btn" onClick={() => setSuccess(false)}>Send Another</button>
                    </div>
                ) : (
                    <div className="support-card-wrapper">
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
                                            <Star size={28} fill={formData.rating >= s ? "currentColor" : "none"} />
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Subject</label>
                                <div className="input-with-icon">
                                    <Tag size={18} className="field-icon" />
                                    <input
                                        type="text"
                                        placeholder="What is this about?"
                                        className="support-form-control"
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Message</label>
                                <div className="input-with-icon">
                                    <MessageSquare size={18} className="field-icon" style={{ top: '16px' }} />
                                    <textarea
                                        rows="5"
                                        placeholder="Describe your issue or feedback..."
                                        className="support-form-control"
                                        style={{ paddingLeft: '48px', paddingTop: '14px' }}
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    ></textarea>
                                </div>
                            </div>

                            {error && <div className="error-banner-small">{error}</div>}

                            <button type="submit" className="submit-btn" disabled={loading}>
                                {loading ? 'Submitting...' : (
                                    <>
                                        Send Feedback <Send size={18} />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Support;
