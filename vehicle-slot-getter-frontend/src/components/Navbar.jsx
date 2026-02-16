import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import '../styles/Navbar.css';

const Navbar = () => {
    const { user, logout, isAdmin, isStaff, isAuthenticated } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Don't show Navbar on login and register pages if not authenticated
    // (App.js will handle conditional rendering, but this is a safety check)
    if (!isAuthenticated && (location.pathname === '/login' || location.pathname === '/register')) {
        return null;
    }

    const handleLogout = () => {
        logout();
        navigate('/login');
        setIsMenuOpen(false);
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <nav className={`navbar ${theme}`}>
            <div className="navbar-container">
                <Link to="/" className="navbar-logo" onClick={() => setIsMenuOpen(false)}>
                    <span className="logo-icon">🅿️</span>
                    <span className="logo-text">Smart Parking</span>
                </Link>

                <div className={`menu-toggle ${isMenuOpen ? 'active' : ''}`} onClick={toggleMenu}>
                    <span className="bar"></span>
                    <span className="bar"></span>
                    <span className="bar"></span>
                </div>

                <ul className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
                    {isAuthenticated && (
                        <>
                            {isAdmin && (
                                <li className="nav-item">
                                    <Link
                                        to="/admin/dashboard"
                                        className={`nav-link ${location.pathname === '/admin/dashboard' ? 'active' : ''}`}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Dashboard
                                    </Link>
                                </li>
                            )}

                            {isStaff && (
                                <li className="nav-item">
                                    <Link
                                        to="/staff/dashboard"
                                        className={`nav-link ${location.pathname === '/staff/dashboard' ? 'active' : ''}`}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Staff Panel
                                    </Link>
                                </li>
                            )}

                            {!isAdmin && !isStaff && (
                                <>
                                    <li className="nav-item">
                                        <Link
                                            to="/home"
                                            className={`nav-link ${location.pathname === '/home' ? 'active' : ''}`}
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            Home
                                        </Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link
                                            to="/bookings"
                                            className={`nav-link ${location.pathname === '/bookings' ? 'active' : ''}`}
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            Find Parking
                                        </Link>
                                    </li>
                                </>
                            )}

                            <li className="nav-item user-info-mobile">
                                <span className="user-name">Hi, {user?.name?.split(' ')[0]}</span>
                            </li>

                            <li className="nav-item">
                                <button className="theme-toggle-nav" onClick={toggleTheme} title="Toggle Theme">
                                    {theme === 'light' ? '🌙' : '☀️'}
                                </button>
                            </li>

                            <li className="nav-item">
                                <button className="logout-nav-btn" onClick={handleLogout}>
                                    Logout
                                </button>
                            </li>
                        </>
                    )}

                    {!isAuthenticated && (
                        <>
                            <li className="nav-item">
                                <Link to="/login" className="nav-link" onClick={() => setIsMenuOpen(false)}>Login</Link>
                            </li>
                            <li className="nav-item">
                                <Link to="/register" className="nav-link signup-btn" onClick={() => setIsMenuOpen(false)}>Sign Up</Link>
                            </li>
                        </>
                    )}
                </ul>

                {isAuthenticated && (
                    <div className="navbar-user-desktop">
                        <span className="user-name">Hi, {user?.name?.split(' ')[0]}</span>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
