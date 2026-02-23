import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Profile.css';

const Profile = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
    });

    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        // Simulate update since backend might need new endpoint
        setTimeout(() => {
            setLoading(false);
            setMessage('Profile updated successfully (Simulated)');
            setIsEditing(false);
            setTimeout(() => setMessage(''), 3000);
        }, 1000);
    };

    return (
        <div className="profile-page">
            <div className="profile-header">
                <button className="back-btn" onClick={() => navigate('/home')}>← Back</button>
                <h1>My Profile</h1>
            </div>

            <div className="profile-container">
                <div className="profile-card">
                    <div className="profile-avatar">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>

                    <form className="profile-form" onSubmit={handleUpdate}>
                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                disabled={!isEditing}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                value={formData.email}
                                disabled={true} // Usually email is not changeable without verification
                            />
                        </div>

                        <div className="form-group">
                            <label>Account Role</label>
                            <input
                                type="text"
                                value={user?.role?.toUpperCase() || 'USER'}
                                disabled={true}
                            />
                        </div>

                        {message && <div className="success-msg">{message}</div>}

                        <div className="profile-actions">
                            {!isEditing ? (
                                <button
                                    type="button"
                                    className="edit-btn"
                                    onClick={() => setIsEditing(true)}
                                >
                                    Edit Profile
                                </button>
                            ) : (
                                <>
                                    <button type="submit" className="save-btn" disabled={loading}>
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button
                                        type="button"
                                        className="cancel-btn"
                                        onClick={() => setIsEditing(false)}
                                    >
                                        Cancel
                                    </button>
                                </>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
