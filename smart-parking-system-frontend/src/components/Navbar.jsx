import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import {
  MapPin,
  Home,
  CalendarDays,
  History,
  User,
  Headphones,
  LayoutDashboard,
  ShieldCheck,
  Sun,
  Moon,
  ChevronDown,
  LogOut,
  AlertTriangle,
  WifiOff,
} from 'lucide-react';
import logoImg from '../assets/custom_logo.png';
import '../styles/Navbar.css';

/* ── UserAction ─────────────────────────────────────────────
   Single component: avatar + name → routes to /profile
   Small chevron → toggles logout dropdown
────────────────────────────────────────────────────────────── */
const UserAction = ({ user, onLogout, theme, toggleTheme }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className={`user-action ${open ? 'open' : ''}`} ref={ref}>
      {/* Main pill — click avatar/name to go to /profile */}
      <div className="user-action-trigger">
        <button
          className="user-action-profile-btn"
          onClick={() => navigate('/profile')}
          title="View Profile"
        >
          <div className="user-avatar">{getInitials(user?.name)}</div>
          <span className="user-greeting">{user?.name?.split(' ')[0]}</span>
        </button>

        {/* Chevron — click to open dropdown */}
        <button
          className="user-action-chevron"
          onClick={() => setOpen((v) => !v)}
          title="Account options"
          aria-expanded={open}
        >
          <ChevronDown size={14} strokeWidth={2} className="chevron-icon" />
        </button>
      </div>

      {/* Dropdown */}
      {open && (
        <div className={`user-dropdown ${theme}`}>
          <div className="dropdown-section">
            <button
              className="dropdown-item"
              onClick={() => { setOpen(false); navigate('/profile'); }}
            >
              <User size={16} strokeWidth={1.5} />
              <span>My Profile</span>
            </button>

            <button
              className="dropdown-item theme-item"
              onClick={() => { toggleTheme(); }}
            >
              {theme === 'light' ? (
                <>
                  <Sun size={16} strokeWidth={1.5} />
                  <span>Appearance: Light</span>
                </>
              ) : (
                <>
                  <Moon size={16} strokeWidth={1.5} />
                  <span>Appearance: Dark</span>
                </>
              )}
            </button>
          </div>
          
          <div className="dropdown-divider" />

          <div className="dropdown-section">
            <button
              className="dropdown-item danger nav-logout-btn"
              onClick={() => { setOpen(false); onLogout(); }}
            >
              <LogOut size={16} strokeWidth={1.5} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Navbar ─────────────────────────────────────────────────── */
const Navbar = () => {
  const { user, logout, isAdmin, isStaff, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // System Status Monitoring
  const [systemStatus, setSystemStatus] = useState('checking');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const BASE_URL =
  process.env.REACT_APP_API_URL ||
  'https://smart-parking-system-backend-w5kn.onrender.com';
        const response = await axios.get(BASE_URL, { timeout: 3000 });
        if (response.data.success) {
          setSystemStatus(
            response.data.database?.status === 'connected' ? 'online' : 'degraded'
          );
        }
      } catch {
        setSystemStatus('online');
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  // Auth pages — show only status banner
  if (!isAuthenticated && (location.pathname === '/login' || location.pathname === '/register')) {
    return (
      <div className="global-status-wrapper">
        {systemStatus === 'offline' && (
          <div className="status-banner offline">
            <WifiOff size={13} strokeWidth={1.5} />
            Backend Server is Offline. Please start the backend service.
          </div>
        )}
        {systemStatus === 'degraded' && (
          <div className="status-banner warning">
            <AlertTriangle size={13} strokeWidth={1.5} />
            Database connection failed. System running in limited mode.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="navbar-wrapper">
      {systemStatus === 'offline' && (
        <div className="status-banner offline">
          <WifiOff size={13} strokeWidth={1.5} />
          Backend is Offline. Results may not load.
        </div>
      )}
      {systemStatus === 'degraded' && (
        <div className="status-banner warning">
          <AlertTriangle size={13} strokeWidth={1.5} />
          Database is Disconnected. Using cached data.
        </div>
      )}

      <nav className={`navbar ${theme}`}>
        <div className="navbar-container">

          {/* ── Logo ─────────────────────────────── */}
          <Link to="/" className="navbar-logo" onClick={() => setIsMenuOpen(false)}>
            <div className="logo-icon-box" style={{ background: 'transparent', boxShadow: 'none' }}>
              <img src={logoImg} alt="Smart Parking Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
            </div>
            <div className="logo-brand">
              <span className="logo-name">Smart Parking</span>
              <span className="logo-tagline">by VehicleSlot</span>
            </div>
          </Link>

          {/* ── Location pill ────────────────────── */}
          {isAuthenticated && !isAdmin && !isStaff && (
            <Link to="/bookings" className="navbar-location" onClick={() => setIsMenuOpen(false)}>
              <MapPin size={13} color="#8B5CF6" strokeWidth={2} />
              <div className="loc-text">
                <span className="loc-city">Find Parking</span>
                <span className="loc-sub">near you</span>
              </div>
            </Link>
          )}

          {/* ── Spacer ───────────────────────────── */}
          <div className="nav-spacer" />

          {/* ── Hamburger ────────────────────────── */}
          <div
            className={`menu-toggle ${isMenuOpen ? 'active' : ''}`}
            onClick={() => setIsMenuOpen((v) => !v)}
            role="button"
            aria-label="Toggle menu"
          >
            <span className="bar" />
            <span className="bar" />
            <span className="bar" />
          </div>

          {/* ── Nav menu ─────────────────────────── */}
          <ul className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
            {isAuthenticated && (
              <>


                {isAdmin && (
                  <li className="nav-item">
                    <Link
                      to="/admin/dashboard"
                      className={`nav-link ${isActive('/admin/dashboard') ? 'active' : ''}`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <LayoutDashboard size={15} strokeWidth={1.5} />
                      Dashboard
                    </Link>
                  </li>
                )}

                {isStaff && (
                  <li className="nav-item">
                    <Link
                      to="/staff/dashboard"
                      className={`nav-link ${isActive('/staff/dashboard') ? 'active' : ''}`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <ShieldCheck size={15} strokeWidth={1.5} />
                      Staff Panel
                    </Link>
                  </li>
                )}

                {!isAdmin && !isStaff && (
                  <>
                    <li className="nav-item">
                      <Link
                        to="/home"
                        className={`nav-link ${isActive('/home') ? 'active' : ''}`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Home size={15} strokeWidth={1.5} />
                        Home
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link
                        to="/bookings"
                        className={`nav-link ${isActive('/bookings') ? 'active' : ''}`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <CalendarDays size={15} strokeWidth={1.5} />
                        Book Slot
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link
                        to="/bookings/history"
                        className={`nav-link ${isActive('/bookings/history') ? 'active' : ''}`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <History size={15} strokeWidth={1.5} />
                        History
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link
                        to="/support"
                        className={`nav-link ${isActive('/support') ? 'active' : ''}`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Headphones size={15} strokeWidth={1.5} />
                        Support
                      </Link>
                    </li>
                  </>
                )}


              </>
            )}

            {!isAuthenticated && (
              <>
                <li className="nav-item">
                  <Link to="/login" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                    Login
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/register" className="signup-pill" onClick={() => setIsMenuOpen(false)}>
                    Sign Up
                  </Link>
                </li>
              </>
            )}
          </ul>

          <div className="nav-spacer desktop-spacer" />

          {/* ── Right side (desktop) ──────────────── */}
          <div className="navbar-right">
            {/* Theme toggle */}
            <button className="theme-toggle-nav" onClick={toggleTheme} title="Toggle Theme">
              {theme === 'light'
                ? <Moon size={15} strokeWidth={1.5} />
                : <Sun size={15} strokeWidth={1.5} color="#facc15" fill="#facc15" />}
            </button>

            {/* UserAction — desktop only */}
            {isAuthenticated && (
              <UserAction user={user} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
            )}

            {/* Sign in / sign up pills for unauthenticated desktop */}
            {!isAuthenticated && (
              <>
                <Link to="/login" className="nav-link" style={{ display: 'none' }}>Login</Link>
                <Link to="/register" className="signup-pill">Sign Up</Link>
              </>
            )}
          </div>

        </div>
      </nav>
    </div>
  );
};

export default Navbar;
