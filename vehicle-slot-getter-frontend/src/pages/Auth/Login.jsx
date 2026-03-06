import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const { login, verifyLoginOTP } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState('');
  const [step, setStep] = useState(1); // 1: Login, 2: OTP
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const data = await login(formData.email, formData.password);

      if (data.success) {
        if (data.requireOTP) {
          setUserId(data.userId);
          setStep(2);
          setError('');
        } else {
          // Redirect based on user role (if OTP not required - though it's required now)
          const user = data.user;
          handleRedirect(user);
        }
      } else {
        setError(data.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const data = await verifyLoginOTP(userId, otp);
      if (data.success) {
        handleRedirect(data.user);
      } else {
        setError(data.message || 'Invalid OTP');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRedirect = (user) => {
    if (user?.role === 'admin') {
      navigate('/admin/dashboard');
    } else if (user?.role === 'staff') {
      navigate('/staff/dashboard');
    } else {
      navigate('/bookings');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">🅿️</div>
          <h1>Smart Parking</h1>
          <p>Welcome Back</p>
        </div>

        {error && (
          <div className="auth-error">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={step === 1 ? handleSubmit : handleVerifyOTP} className="auth-form">
          {step === 1 ? (
            <>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-wrapper">
                  <span className="input-icon">✉️</span>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    disabled={loading}
                    autoComplete="email"
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
                    onChange={handleChange}
                    placeholder="Enter your password"
                    disabled={loading}
                    autoComplete="current-password"
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
            </>
          ) : (
            <div className="form-group">
              <label htmlFor="otp">Enter Verification Code</label>
              <div className="input-wrapper">
                <span className="input-icon">🔑</span>
                <input
                  type="text"
                  id="otp"
                  name="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="6-digit OTP"
                  maxLength="6"
                  disabled={loading}
                  autoComplete="one-time-code"
                />
              </div>
              <p className="otp-help-text">
                We've sent a 6-digit code to <strong>{formData.email}</strong>
              </p>
            </div>
          )}

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-small"></span>
                {step === 1 ? 'Signing in...' : 'Verifying...'}
              </>
            ) : (
              step === 1 ? 'Sign In' : 'Verify OTP'
            )}
          </button>

          {step === 2 && (
            <button
              type="button"
              className="back-button"
              onClick={() => setStep(1)}
              disabled={loading}
            >
              Back to Login
            </button>
          )}
        </form>

        <div className="auth-divider">or</div>

        <div className="auth-demo">
          <p>Demo Credentials:</p>
          <div className="demo-user">
            <strong>User:</strong> user@example.com / password123
          </div>
          <div className="demo-user">
            <strong>Admin:</strong> admin@example.com / admin123
          </div>
          <div className="demo-user">
            <strong>Staff:</strong> staff@example.com / staff123
          </div>
        </div>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Sign up here
            </Link>
          </p>
          <p>
            <Link to="/forgot-password" className="auth-link">
              Forgot password?
            </Link>
          </p>
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

export default Login;
