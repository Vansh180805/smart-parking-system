import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { authService } from '../../services/api';
import { 
  Mail, Lock, Eye, EyeOff, ParkingCircle, 
  AlertCircle, Send, ArrowLeft, LogIn, Sun, Moon 
} from 'lucide-react';
import '../../styles/Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth(); // Local login function
  const { theme, toggleTheme } = useTheme();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Simulation States (Reduced)
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

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
        const user = data.user;
        if (user?.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (user?.role === 'staff') {
          navigate('/staff/dashboard');
        } else {
          navigate('/home');
        }
      } else {
        setError(data.message || 'Invalid email or password');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');
    try {
      // Send token to backend
      const res = await authService.googleLogin({
        token: credentialResponse.credential
      });
      
      if (res.data.success) {
        // Use the login function from context to set the user state locally
        // We might need to update AuthContext to handle token+user from Google res
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        
        // Custom event or simple reload to refresh context if needed
        // Or better, update AuthContext to have a 'setSession' method
        window.location.href = '/home'; 
      }
    } catch (err) {
      console.error("Google Login Error:", err);
      setError(err.response?.data?.message || "Google Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = (error) => {
    console.error("Google Login Failed:", error);
    setError(
      <span>
        Google Sign-In failed. <b>Origin mismatch?</b> <br />
        Please ensure <code>http://localhost:3002</code> is added to 
        "Authorized JavaScript Origins" in your Google Cloud Console.
      </span>
    );
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    if (!formData.email) {
      setError("Please enter your email to reset password");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setEmailSent(true);
      setLoading(false);
    }, 1200);
  };

  if (forgotPasswordMode) {
    return (
      <div className="auth-container">
        <div className="auth-card forgot-password">
          <div className="auth-header">
            <div className="auth-icon accent-glow">
              <Lock size={48} />
            </div>
            <h1>Reset Password</h1>
            <p>Enter your email to receive a reset link</p>
          </div>

          {emailSent ? (
            <div className="auth-info" style={{ textAlign: 'center', color: 'white' }}>
              <div className="info-icon-wrapper">
                <Mail size={48} />
              </div>
              <h3>Email Sent!</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                We've sent a password reset link to <br />
                <strong style={{ color: '#6366f1' }}>{formData.email}</strong>
              </p>
              <button 
                className="auth-button" 
                style={{ marginTop: '24px' }}
                onClick={() => setForgotPasswordMode(false)}
              >
                <ArrowLeft size={18} /> Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="auth-form">
              <div className="form-group">
                <label htmlFor="reset-email">Email Address</label>
                <div className="input-wrapper">
                  <Mail className="input-icon" size={20} />
                  <input
                    type="email"
                    id="reset-email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>
              <button type="submit" className="auth-button" disabled={loading}>
                {loading ? 'Sending...' : <><Send size={18} /> Send Reset Link</>}
              </button>
              <button 
                type="button" 
                className="auth-link-btn" 
                onClick={() => setForgotPasswordMode(false)}
              >
                <ArrowLeft size={16} /> Back to Login
              </button>
            </form>
          )}
        </div>
        <div className="auth-background">
          <div className="bg-element bg-1"></div>
          <div className="bg-element bg-2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <button className="theme-toggle-auth" onClick={toggleTheme} title="Toggle Theme">
          {theme === 'light'
            ? <Moon size={18} strokeWidth={1.5} />
            : <Sun size={18} strokeWidth={1.5} color="#facc15" fill="#facc15" />}
        </button>
        {/* Left Side: Hero Section */}
        <div className="auth-hero">
          <div className="hero-content">
            <div className="brand-logo">
              <ParkingCircle size={64} className="brand-logo-icon" />
            </div>
            <h1>Smart Parking</h1>
            <p>The most elegant way to manage your vehicle slots and parking operations.</p>
            
            <div className="hero-features">
              <div className="feature-item">
                <div className="feature-dot"></div>
                <span>Real-time Slot Tracking</span>
              </div>
              <div className="feature-item">
                <div className="feature-dot"></div>
                <span>Seamless Payments</span>
              </div>
              <div className="feature-item">
                <div className="feature-dot"></div>
                <span>Advanced Analytics</span>
              </div>
            </div>
          </div>
          <div className="hero-overlay"></div>
        </div>

        {/* Right Side: Form Section */}
        <div className="auth-card login-card">
          <div className="auth-header">
            <h2>Welcome Back</h2>
            <p>Login to your account to continue</p>
          </div>

          {error && (
            <div className="auth-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={20} />
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="password">Password</label>
                <button 
                  type="button" 
                  onClick={() => setForgotPasswordMode(true)}
                  className="auth-link" 
                  style={{ fontSize: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  Forgot Password?
                </button>
              </div>
              <div className="input-wrapper">
                <Lock className="input-icon" size={20} />
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
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="auth-button"
              disabled={loading}
            >
              {loading ? 'Sign-in in progress...' : <><LogIn size={18} /> Sign In</>}
            </button>
          </form>

          <div className="auth-divider">
            <span>or continue with</span>
          </div>

          <div className="google-login-wrapper" style={{ display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="filled_blue"
              shape="pill"
              text="signin_with"
              size="large"
              width="200px"
            />
          </div>

          <div className="auth-footer">
            <p>
              New user?{' '}
              <Link to="/register" className="auth-link">
                Create an account
              </Link>
            </p>
          </div>

          <div className="pro-tip">
            <strong>Pro-Tip:</strong> Use demo credentials for quick access. 
            <div className="tip-creds">user@example.com / password123</div>
          </div>
        </div>
      </div>

      <div className="auth-background">
        <div className="bg-element bg-1"></div>
        <div className="bg-element bg-2"></div>
      </div>
    </div>
  );
};

export default Login;
