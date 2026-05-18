import axios from 'axios';

// Fallback to localhost which resolves IPv6/IPv4 correctly on Windows
const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check for Connection Refused / Network Error
    if (error.code === 'ERR_NETWORK' || !error.response) {
      console.error("🌐 Backend Connection Failed. Is the server running on port 5000?");
      error.message = "Unable to connect to the server. Please check if the backend is running.";
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ===== AUTH SERVICES =====
export const authService = {
  register: (data) => api.post('/auth/register', data),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  resendOTP: (data) => api.post('/auth/resend-otp', data),
  login: (data) => api.post('/auth/login', data),
  verifyLoginOTP: (data) => api.post('/auth/login-verify', data),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  googleLogin: (data) => api.post('/auth/google', data),
};

// ===== PARKING SERVICES =====
export const parkingService = {
  getAllParking: (page, limit, city) =>
    api.get('/parking/all', { params: { page, limit, city } }),
  getNearbyParking: (lat, lon, radius) =>
    api.get('/parking/nearby', { params: { lat, lon, radius } }),
  getParkingDetails: (parkingId) => api.get(`/parking/${parkingId}/details`),
  getParkingStats: (parkingId) => api.get(`/parking/${parkingId}/stats`),
};

// ===== BOOKING SERVICES =====
export const bookingService = {
  getNearestParking: (lat, lon, radius) =>
    api.get('/bookings/nearest-parking', { params: { lat, lon, radius } }),
  getParkingSlots: (parkingId, vehicleType) =>
    api.get(`/bookings/parking/${parkingId}/slots`, { params: { vehicleType } }),
  createBooking: (data) => api.post('/bookings/create', data),
  paymentQR: (bookingId) => api.post(`/bookings/${bookingId}/pay-qr`),
  getUserBookings: (status, page, limit) =>
    api.get('/bookings/my-bookings', { params: { status, page, limit } }),
  cancelBooking: (bookingId) => api.post(`/bookings/${bookingId}/cancel`),
  checkOverstay: (bookingId) => api.get(`/bookings/${bookingId}/check-overstay`),
  exitParking: (bookingId) => api.post(`/bookings/${bookingId}/exit`),
  getBookingById: (bookingId) => api.get(`/bookings/${bookingId}`),
  createPaymentOrder: (bookingId, type = 'BOOKING', simulate = false) => 
    api.post('/payments/create-order', { bookingId, type, simulate }),
  verifyPayment: (paymentData) => api.post('/payments/verify', paymentData),
};

// ===== STAFF SERVICES =====
export const staffService = {
  verifyParking: (data) => api.post('/staff/verify-parking', data),
  markUnparked: (bookingId) => api.post(`/staff/mark-unparked/${bookingId}`),
  getPendingEntries: (parkingId, page, limit) =>
    api.get('/staff/pending-entries', { params: { parkingId, page, limit } }),
  getParkedVehicles: (parkingId, page, limit) =>
    api.get('/staff/parked-vehicles', { params: { parkingId, page, limit } }),
  getBookingDetails: (bookingId) => api.get(`/staff/booking/${bookingId}`),
};

// ===== ADMIN SERVICES =====
export const adminService = {
  getDashboardSummary: () => api.get('/admin/dashboard-summary'),
  getVehicleStats: (startDate, endDate) =>
    api.get('/admin/vehicle-stats', { params: { startDate, endDate } }),
  getRevenueStats: (days) => api.get('/admin/revenue-stats', { params: { days } }),
  getBookingTrends: (days) => api.get('/admin/booking-trends', { params: { days } }),
  getFineStats: (startDate, endDate) =>
    api.get('/admin/fine-stats', { params: { startDate, endDate } }),
  getParkingPerformance: () => api.get('/admin/parking-performance'),
  getHourlyTrends: () => api.get('/admin/hourly-trends'),
  getAllFeedback: () => api.get('/feedbacks/all'),
  updateFeedbackStatus: (id, status) => api.put(`/feedbacks/${id}`, { status }),
};

// ===== FEEDBACK SERVICES =====
export const feedbackService = {
  submitFeedback: (data) => api.post('/feedbacks', data),
  updateFeedbackStatus: (id, status) => api.put(`/feedbacks/${id}`, { status }),
};

export default api;
