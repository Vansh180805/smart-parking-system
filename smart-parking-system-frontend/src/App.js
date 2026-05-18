import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Auth Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';

// User Pages
import UserHome from './pages/User/UserHome';
import UserParking from './pages/User/UserParking';
import PaymentPage from './pages/User/PaymentPage';
import BookingHistory from './pages/User/BookingHistory';
import Profile from './pages/User/Profile';
import Support from './pages/User/Support';

// Admin Pages
import AdminDashboard from './pages/Admin/AdminDashboard';

// Staff Pages
import StaffDashboard from './pages/Staff/StaffDashboard';

// Components
import Navbar from './components/Navbar';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, isAdmin, isStaff } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole === 'admin' && !isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requiredRole === 'staff' && !isStaff) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Redirect Helper Component
const RedirectToDashboard = () => {
  const { isAuthenticated, isAdmin, isStaff } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (isStaff) {
    return <Navigate to="/staff/dashboard" replace />;
  }

  return <Navigate to="/home" replace />;
};

// Main App Routes
const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Auth Routes - redirect to home if already logged in */}
      <Route
        path="/login"
        element={isAuthenticated ? <RedirectToDashboard /> : <Login />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <RedirectToDashboard /> : <Register />}
      />

      {/* User Routes */}
      <Route
        path="/bookings"
        element={
          <ProtectedRoute>
            <UserParking />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payment/:bookingId"
        element={
          <ProtectedRoute>
            <PaymentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <UserHome />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings/history"
        element={
          <ProtectedRoute>
            <BookingHistory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/support"
        element={
          <ProtectedRoute>
            <Support />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Staff Routes */}
      <Route
        path="/staff/dashboard"
        element={
          <ProtectedRoute requiredRole="staff">
            <StaffDashboard />
          </ProtectedRoute>
        }
      />

      {/* Default Routes */}
      <Route path="/" element={<RedirectToDashboard />} />

      {/* 404 Not Found */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Get Client ID from Env
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

// Main App Component
function App() {
  if (!GOOGLE_CLIENT_ID) {
    console.warn("⚠️ REACT_APP_GOOGLE_CLIENT_ID is missing from .env file. Google Login will not function.");
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID || ""}>
      <Router>
        <AuthProvider>
          <ThemeProvider>
            <div className="app-container">
              <div className="global-bg-gradient"></div>
              <div className="global-bg-glow"></div>
              <Navbar />
              <AppRoutes />
            </div>
          </ThemeProvider>
        </AuthProvider>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
