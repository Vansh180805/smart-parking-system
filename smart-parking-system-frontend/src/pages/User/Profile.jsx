import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  User,
  Mail,
  ShieldCheck,
  Pencil,
  Save,
  X,
  CheckCircle2,
} from 'lucide-react';
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
    setTimeout(() => {
      setLoading(false);
      setMessage('Profile updated successfully');
      setIsEditing(false);
      setTimeout(() => setMessage(''), 3500);
    }, 1000);
  };

  // Initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  };

  return (
    <div className="profile-page">
      <div className="profile-inner">

        {/* ── Left panel — Avatar hero ──────────────────────── */}
        <aside className="profile-left">
          <button className="back-btn" onClick={() => navigate('/home')}>
            <ArrowLeft size={15} strokeWidth={1.5} />
            Back
          </button>

          <div className="avatar-hero">
            <div className="avatar-glow" />
            <div className="profile-avatar">
              {getInitials(user?.name)}
            </div>
          </div>

          <div className="profile-meta">
            <h2 className="profile-name">{user?.name || 'User'}</h2>
            <span className="profile-role-badge">
              <ShieldCheck size={12} strokeWidth={1.5} />
              {user?.role?.toUpperCase() || 'USER'}
            </span>
          </div>

          <p className="profile-hint">
            Click "Edit Profile" to update your name.
          </p>
        </aside>

        {/* ── Right panel — Form ────────────────────────────── */}
        <main className="profile-right">
          <div className="profile-right-header">
            <div>
              <p className="section-eyebrow">Account</p>
              <h1>My Profile</h1>
            </div>
            {!isEditing && (
              <button className="edit-btn" onClick={() => setIsEditing(true)}>
                <Pencil size={14} strokeWidth={1.5} />
                Edit Profile
              </button>
            )}
          </div>

          {message && (
            <div className="success-msg">
              <CheckCircle2 size={15} strokeWidth={1.5} />
              {message}
            </div>
          )}

          <form className="profile-form" onSubmit={handleUpdate}>
            {/* Full Name */}
            <div className="form-field">
              <label className="field-label">
                <User size={12} strokeWidth={1.5} />
                Full Name
              </label>
              <input
                type="text"
                className={`field-input ${isEditing ? 'editable' : ''}`}
                value={formData.name}
                disabled={!isEditing}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your full name"
              />
            </div>

            {/* Email */}
            <div className="form-field">
              <label className="field-label">
                <Mail size={12} strokeWidth={1.5} />
                Email Address
              </label>
              <input
                type="email"
                className="field-input"
                value={formData.email}
                disabled={true}
                placeholder="Email address"
              />
              <span className="field-hint">Email cannot be changed.</span>
            </div>

            {/* Role */}
            <div className="form-field">
              <label className="field-label">
                <ShieldCheck size={12} strokeWidth={1.5} />
                Account Role
              </label>
              <input
                type="text"
                className="field-input"
                value={user?.role?.toUpperCase() || 'USER'}
                disabled={true}
              />
            </div>

            {isEditing && (
              <div className="form-actions">
                <button type="submit" className="save-btn" disabled={loading}>
                  {loading ? (
                    <span className="mini-spinner" />
                  ) : (
                    <Save size={15} strokeWidth={1.5} />
                  )}
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setIsEditing(false)}
                >
                  <X size={15} strokeWidth={1.5} />
                  Cancel
                </button>
              </div>
            )}
          </form>
        </main>

      </div>
    </div>
  );
};

export default Profile;
