import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api';
import '../../styles/Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const { register, verifyOTP } = useAuth();

  const [step, setStep] = useState(1); // 1: Form, 2: OTP Verification
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Step 1: User Registration
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  // Step 2: OTP Verification
  const [otpData, setOtpData] = useState({
    userId: '',
    otp: '',
  });

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      setError('Please enter a valid 10-digit phone number');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const data = await register(
        formData.name,
        formData.email,
        formData.phone,
        formData.password
      );

      if (data.success) {
        // If the backend returns token and user (auto-login after registration)
        if (data.token && data.user) {
          setError('');
          navigate('/bookings');
          return;
        }

        setOtpData(prev => ({
          ...prev,
          userId: data.userId,
        }));
        setStep(2);
        setError('');
      } else {
        setError(data.message || 'Registration failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred during registration');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtpData(prev => ({
      ...prev,
      otp: value,
    }));
    if (error) setError('');
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();

    if (!otpData.otp || otpData.otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      await verifyOTP(otpData.userId, otpData.otp);

      // Auto-login logic is inside verifyOTP, so we just navigate
      navigate('/bookings');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred during OTP verification');
      console.error('OTP verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;

    setLoading(true);
    try {
      const response = await authService.resendOTP({ email: formData.email });

      if (response.data.success) {
        setError('');
        setResendTimer(60);
        const timer = setInterval(() => {
          setResendTimer(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(response.data.message || 'Failed to resend OTP');
      }
    } catch (err) {
      setError(err.message || 'Failed to resend OTP');
      console.error('Resend OTP error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card register-card">
        <div className="auth-header">
          <div className="auth-icon">🅿️</div>
          <h1>Smart Parking</h1>
          <p>{step === 1 ? 'Create Account' : 'Verify Email'}</p>
        </div>

        {error && (
          <div className="auth-error">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRegisterSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <div className="input-wrapper">
                <span className="input-icon">👤</span>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="Enter your full name"
                  disabled={loading}
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon">✉️</span>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  placeholder="Enter your email"
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <div className="input-wrapper">
                <span className="input-icon">📱</span>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  placeholder="Enter 10-digit phone number"
                  disabled={loading}
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleFormChange}
                  placeholder="Min 6 characters"
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleFormChange}
                  placeholder="Re-enter password"
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="auth-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOTPSubmit} className="auth-form otp-form">
            <div className="otp-info">
              <p>Enter the 6-digit OTP sent to</p>
              <p className="otp-email">{formData.email}</p>
            </div>

            <div className="form-group">
              <label htmlFor="otp">Verification Code</label>
              <div className="input-wrapper">
                <span className="input-icon">🔐</span>
                <input
                  type="text"
                  id="otp"
                  value={otpData.otp}
                  onChange={handleOTPChange}
                  placeholder="000000"
                  disabled={loading}
                  inputMode="numeric"
                  maxLength="6"
                  className="otp-input"
                />
              </div>
            </div>

            <button
              type="submit"
              className="auth-button"
              disabled={loading || otpData.otp.length !== 6}
            >
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  Verifying...
                </>
              ) : (
                'Verify & Sign Up'
              )}
            </button>

            <div className="otp-footer">
              <p>Didn't receive OTP?</p>
              <button
                type="button"
                className="resend-btn"
                onClick={handleResendOTP}
                disabled={loading || resendTimer > 0}
              >
                {resendTimer > 0 ? (
                  <span>Resend in {resendTimer}s</span>
                ) : (
                  'Resend OTP'
                )}
              </button>
            </div>

            <button
              type="button"
              className="change-email-btn"
              onClick={() => {
                setStep(1);
                setOtpData({ userId: '', otp: '' });
              }}
              disabled={loading}
            >
              Change Email
            </button>
          </form>
        )}

        <div className="auth-footer">
          {step === 1 && (
            <p>
              Already have an account?{' '}
              <Link to="/login" className="auth-link">
                Sign in here
              </Link>
            </p>
          )}
        </div>
      </div>

      <div className="auth-background">
        <div className="bg-element bg-1"></div>
        <div className="bg-element bg-2"></div>
        <div className="bg-element bg-3"></div>
      </div>
    </div>
  );
};

export default Register;
