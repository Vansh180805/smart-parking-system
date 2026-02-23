import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { adminService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import '../../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [summary, setSummary] = useState(null);
  const [vehicleStats, setVehicleStats] = useState([]);

  const [revenueStats, setRevenueStats] = useState([]);
  const [bookingTrends, setBookingTrends] = useState([]);
  const [hourlyTrends, setHourlyTrends] = useState([]);
  const [fineStats, setFineStats] = useState(null);
  const [parkingPerformance, setParkingPerformance] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe'];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [
        summaryRes,
        vehicleRes,
        revenueRes,
        bookingRes,
        hourlyRes,
        fineRes,
        parkingRes,
        feedbackRes,
      ] = await Promise.all([
        adminService.getDashboardSummary(),
        adminService.getVehicleStats(),
        adminService.getRevenueStats(7),
        adminService.getBookingTrends(7),
        adminService.getHourlyTrends(),
        adminService.getFineStats(),
        adminService.getParkingPerformance(),
        adminService.getAllFeedback(),
      ]);

      setSummary(summaryRes.data.data);
      setVehicleStats(
        vehicleRes.data.data.byType.map((item) => ({
          ...item,
          name: item.vehicleType.charAt(0).toUpperCase() + item.vehicleType.slice(1).replace(/([A-Z])/g, ' $1'),
        }))
      );
      setRevenueStats(revenueRes.data.data.dailyBreakdown);
      setBookingTrends(bookingRes.data.data.trends);
      setHourlyTrends(hourlyRes.data.data);
      setFineStats(fineRes.data.data);
      setParkingPerformance(parkingRes.data.data);
      setFeedbacks(feedbackRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return <div className="admin-dashboard-error">{error}</div>;
  }

  // Prepare fine distribution data
  const fineDistribution = [
    { name: 'Booking Revenue', value: summary?.totalBookingRevenue || 0 },
    { name: 'Fine Revenue', value: summary?.totalFineRevenue || 0 },
  ];

  return (
    <div className={`admin-dashboard ${theme}`}>
      <div className="dashboard-header">
        <h1>📊 Admin Dashboard</h1>
        <div className="header-actions">
          <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle Theme">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button className="refresh-btn" onClick={fetchDashboardData}>
            🔄 Refresh
          </button>
          <button className="logout-btn" onClick={logout}>
            🚪 Logout
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-cards">
        <div className="kpi-card primary">
          <div className="kpi-icon">🚗</div>
          <div className="kpi-content">
            <p>Today's Vehicles</p>
            <h2>{summary?.vehiclesParkedToday}</h2>
          </div>
        </div>

        <div className="kpi-card warning">
          <div className="kpi-icon">✓</div>
          <div className="kpi-content">
            <p>Total Bookings</p>
            <h2>{summary?.totalBookings}</h2>
          </div>
        </div>

        <div className="kpi-card info">
          <div className="kpi-icon">💰</div>
          <div className="kpi-content">
            <p>Total Revenue</p>
            <h2>₹{summary?.totalRevenue?.toLocaleString()}</h2>
          </div>
        </div>

        <div className="kpi-card danger">
          <div className="kpi-icon">⚠️</div>
          <div className="kpi-content">
            <p>Fine Revenue</p>
            <h2>₹{summary?.totalFineRevenue?.toLocaleString()}</h2>
          </div>
        </div>

        <div className="kpi-card success">
          <div className="kpi-icon">📍</div>
          <div className="kpi-content">
            <p>Occupancy Rate</p>
            <h2>{summary?.occupancyPercentage}%</h2>
          </div>
        </div>

        <div className="kpi-card secondary">
          <div className="kpi-icon">🅰️</div>
          <div className="kpi-content">
            <p>Available Slots</p>
            <h2>{summary?.availableSlots}</h2>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-container">
          <h3>🚙 Vehicle Distribution</h3>
          {vehicleStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={vehicleStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {vehicleStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data-placeholder">
              <p>No bookings yet to show vehicle distribution</p>
            </div>
          )}
        </div>

        <div className="chart-container">
          <h3>💵 Revenue vs Fines</h3>
          {fineDistribution.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={fineDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {fineDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data-placeholder">
              <p>No revenue data generated yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Line and Bar Charts */}
      <div className="charts-section">
        <div className="chart-container full-width">
          <h3>📈 Daily Revenue Trend (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
              <Legend />
              <Line
                type="monotone"
                dataKey="bookingRevenue"
                stroke="#667eea"
                name="Booking Revenue"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="fineRevenue"
                stroke="#ef4444"
                name="Fine Revenue"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-container full-width">
          <h3>📅 Booking Trends (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={bookingTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalBookings" fill="#667eea" name="Total Bookings" />
              <Bar dataKey="completedBookings" fill="#10b981" name="Completed" />
              <Bar dataKey="cancelledBookings" fill="#ef4444" name="Cancelled" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-container full-width">
          <h3>⏰ Hourly Parking Trends (Today)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="vehicles" fill="#764ba2" name="Vehicles Parked" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Parking Performance Table */}
      <div className="charts-section">
        <div className="chart-container full-width">
          <h3>🏢 Parking Lot Performance</h3>
          <div className="table-container">
            <table className="performance-table">
              <thead>
                <tr>
                  <th>Parking Name</th>
                  <th>Total Slots</th>
                  <th>Occupied</th>
                  <th>Occupancy %</th>
                  <th>Bookings</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {parkingPerformance.map((parking) => (
                  <tr key={parking.parkingId}>
                    <td className="parking-name">{parking.parkingName}</td>
                    <td>{parking.totalSlots}</td>
                    <td>{parking.occupiedSlots}</td>
                    <td>
                      <div className="occupancy-bar">
                        <div
                          className="occupancy-fill"
                          style={{
                            width: `${parking.occupancyRate}%`,
                            backgroundColor:
                              parking.occupancyRate > 80
                                ? '#ef4444'
                                : parking.occupancyRate > 50
                                  ? '#f59e0b'
                                  : '#10b981',
                          }}
                        ></div>
                      </div>
                      <span>{parking.occupancyRate}%</span>
                    </td>
                    <td>{parking.completedBookings}</td>
                    <td>₹{parking.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Fine Statistics */}
      {fineStats && (
        <div className="charts-section">
          <div className="stat-box">
            <h3>📋 Fine Statistics</h3>
            <div className="stat-grid">
              <div className="stat-item">
                <label>Total Fines Collected</label>
                <p className="stat-value">₹{fineStats.totalFines?.toLocaleString() || 0}</p>
              </div>
              <div className="stat-item">
                <label>Fine Charges</label>
                <p className="stat-value">{fineStats.totalFineCount || 0}</p>
              </div>
              <div className="stat-item">
                <label>Average Fine</label>
                <p className="stat-value">
                  ₹{Math.round(fineStats.averageFine || 0).toLocaleString()}
                </p>
              </div>
              <div className="stat-item">
                <label>Bookings with Fines</label>
                <p className="stat-value">{fineStats.bookingsWithFines || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Support Feedbacks Section */}
      <div className="charts-section">
        <div className="chart-container full-width">
          <h3>💬 User Support & Feedbacks</h3>
          <div className="table-container">
            <table className="performance-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Subject</th>
                  <th>Rating</th>
                  <th>Message</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {feedbacks.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No feedbacks yet</td></tr>
                ) : feedbacks.map((fb) => (
                  <tr key={fb._id}>
                    <td>
                      <div className="user-cell">
                        <span className="user-name">{fb.name}</span>
                        <span className="user-email">{fb.email}</span>
                      </div>
                    </td>
                    <td>{fb.subject}</td>
                    <td>
                      <div className="rating-stars">
                        {'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}
                      </div>
                    </td>
                    <td className="message-cell">{fb.message}</td>
                    <td>{new Date(fb.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-pill ${fb.status}`}>
                        {fb.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
