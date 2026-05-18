import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ReferenceLine,
} from 'recharts';
import { adminService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  LayoutDashboard, ShieldAlert, Moon, Sun, RefreshCw, LogOut, 
  Car, CheckCircle, DollarSign, AlertTriangle, MapPin, ParkingCircle, 
  PieChart as PieChartIcon, TrendingUp, CalendarDays, Clock, 
  Building2, ClipboardList, MessageSquare, Star
} from 'lucide-react';
import '../../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
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

  const COLORS = ['#8B5CF6', '#7c3aed', '#a855f7', '#6d28d9'];

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
      <div className={`admin-dashboard ${theme}`}>
        <div className="admin-dashboard-loading">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`admin-dashboard ${theme}`}>
        <div className="admin-dashboard-error">{error}</div>
      </div>
    );
  }

  // Prepare fine distribution data
  const fineDistribution = [
    { name: 'Booking Revenue', value: summary?.totalBookingRevenue || 0 },
    { name: 'Fine Revenue', value: summary?.totalFineRevenue || 0 },
  ];

  const isDark = theme === 'dark';
  const axisColor = isDark ? '#d1d5db' : '#6b7280';
  const gridColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';
  const tooltipStyle = {
    backgroundColor: isDark ? 'rgba(14,14,20,0.95)' : 'rgba(255,255,255,0.95)',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
    borderRadius: '12px',
    color: isDark ? '#f4f4f6' : '#1f2937',
    boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.08)',
  };

  return (
    <div className={`admin-dashboard ${theme}`}>
      <div className="dashboard-header">
        <div className="header-bg-glow" />
        <div className="header-content">
          <div className="header-intro">
            <span className="header-eyebrow">
              <LayoutDashboard size={12} strokeWidth={1.5} /> Admin Control Panel
            </span>
            <h1>Admin Dashboard</h1>
            <p>Manage parking slots, revenue, and system settings.</p>
          </div>
          <div className="header-actions">
          <button
            className="switch-btn staff-panel-btn"
            onClick={() => navigate('/staff/dashboard')}
          >
            <ShieldAlert size={16} /> Staff Panel
          </button>
          <button
            className="switch-btn"
            onClick={fetchDashboardData}
          >
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="logout-btn" onClick={logout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>
    </div>

      <div className="admin-container">
        {/* KPI Cards */}
        <div className="kpi-cards">
        <div className="kpi-card primary">
          <div className="kpi-icon"><Car size={24} /></div>
          <div className="kpi-content">
            <p>Today's Vehicles</p>
            <h2>{summary?.vehiclesParkedToday}</h2>
          </div>
        </div>

        <div className="kpi-card warning">
          <div className="kpi-icon"><CheckCircle size={24} /></div>
          <div className="kpi-content">
            <p>Total Bookings</p>
            <h2>{summary?.totalBookings}</h2>
          </div>
        </div>

        <div className="kpi-card secondary">
          <div className="kpi-icon"><ParkingCircle size={24} /></div>
          <div className="kpi-content">
            <p>Available Slots</p>
            <h2>{summary?.availableSlots}</h2>
          </div>
        </div>

        <div className="kpi-card info">
          <div className="kpi-icon"><DollarSign size={24} /></div>
          <div className="kpi-content">
            <p>Total Revenue</p>
            <h2>₹{summary?.totalRevenue?.toLocaleString()}</h2>
          </div>
        </div>

        <div className="kpi-card danger">
          <div className="kpi-icon"><AlertTriangle size={24} /></div>
          <div className="kpi-content">
            <p>Fine Revenue</p>
            <h2>₹{summary?.totalFineRevenue?.toLocaleString()}</h2>
          </div>
        </div>

        <div className="kpi-card success">
          <div className="kpi-icon"><MapPin size={24} /></div>
          <div className="kpi-content">
            <p>Occupancy Rate</p>
            <h2>{summary?.occupancyPercentage}%</h2>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-container">
          <h3><Car size={20} className="inline-icon" /> Vehicle Distribution</h3>
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
                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: isDark ? '#f4f4f6' : '#1f2937' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data-placeholder">
              <p>No bookings yet to show vehicle distribution</p>
            </div>
          )}
        </div>

        <div className="chart-container">
          <h3><DollarSign size={20} className="inline-icon" /> Revenue vs Fines</h3>
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
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} contentStyle={tooltipStyle} itemStyle={{ color: isDark ? '#f4f4f6' : '#1f2937' }} />
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
          <h3><TrendingUp size={20} className="inline-icon" /> Daily Revenue Trend (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueStats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="_id" stroke={axisColor} tick={{ fill: axisColor, fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis stroke={axisColor} tick={{ fill: axisColor, fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
              <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
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
          <h3><CalendarDays size={20} className="inline-icon" /> Booking Trends (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart 
              data={bookingTrends.map((d, i) => ({ ...d, index: i }))} 
              margin={{ top: 20, right: 30, left: 10, bottom: 20 }} 
              barGap={8} 
              barSize={50}
            >
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={1}/>
                  <stop offset="95%" stopColor="#6D28D9" stopOpacity={1}/>
                </linearGradient>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={1}/>
                  <stop offset="95%" stopColor="#059669" stopOpacity={1}/>
                </linearGradient>
                <linearGradient id="colorCancelled" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={1}/>
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              
              {/* Vertical separation lines between dates */}
              {bookingTrends.map((_, i) => (
                i < bookingTrends.length - 1 && (
                  <ReferenceLine 
                    key={`sep-${i}`} 
                    x={i + 0.5} 
                    stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"} 
                    strokeWidth={1}
                  />
                )
              ))}

              <XAxis 
                dataKey="index" 
                type="number"
                domain={[-0.5, bookingTrends.length - 0.5]}
                ticks={bookingTrends.map((_, i) => i)}
                tickFormatter={(i) => bookingTrends[i]?._id || ''}
                stroke={axisColor} 
                tick={{ fill: axisColor, fontSize: 11 }} 
                tickLine={false} 
                axisLine={{ stroke: axisColor, strokeWidth: 1 }} 
                dy={10} 
              />
              <YAxis stroke={axisColor} tick={{ fill: axisColor, fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={tooltipStyle} 
                cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }} 
                borderRadius={12}
              />
              <Legend 
                wrapperStyle={{ 
                  paddingTop: '30px', 
                  fontSize: '12px',
                  display: 'flex',
                  justifyContent: 'center'
                }} 
                iconType="circle" 
                payload={[
                  { value: 'Total Bookings', type: 'circle', id: 'totalBookings', color: '#8B5CF6' },
                  { value: 'Completed', type: 'circle', id: 'completedBookings', color: '#10b981' },
                  { value: 'Cancelled', type: 'circle', id: 'cancelledBookings', color: '#ef4444' }
                ]}
              />
              <Bar dataKey="totalBookings" fill="url(#colorTotal)" name="Total Bookings" radius={[6, 6, 0, 0]} />
              <Bar dataKey="completedBookings" fill="url(#colorCompleted)" name="Completed" radius={[6, 6, 0, 0]} />
              <Bar dataKey="cancelledBookings" fill="url(#colorCancelled)" name="Cancelled" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-container full-width">
          <h3><Clock size={20} className="inline-icon" /> Hourly Parking Trends (Today)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourlyTrends} margin={{ top: 20, right: 30, left: 10, bottom: 20 }} barSize={50}>
              <defs>
                <linearGradient id="colorHourly" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={1}/>
                  <stop offset="95%" stopColor="#6D28D9" stopOpacity={1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="hour" stroke={axisColor} tick={{ fill: axisColor, fontSize: 11 }} tickLine={false} axisLine={{ stroke: axisColor, strokeWidth: 1 }} dy={10} />
              <YAxis stroke={axisColor} tick={{ fill: axisColor, fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }} />
              <Bar dataKey="vehicles" fill="url(#colorHourly)" name="Vehicles Parked" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Parking Performance Table */}
      <div className="charts-section">
        <div className="chart-container full-width">
          <h3><Building2 size={20} className="inline-icon" /> Parking Lot Performance</h3>
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
                    <td>{parking.totalBookings}</td>
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
            <h3><ClipboardList size={20} className="inline-icon" /> Fine Statistics</h3>
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
          <h3><MessageSquare size={20} className="inline-icon" /> User Support & Feedbacks</h3>
          <div className="table-container">
            <table className="performance-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Subject</th>
                  <th>Rating</th>
                  <th>Message</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {feedbacks.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No feedbacks yet</td></tr>
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
                      <div className="rating-stars" style={{ display: 'flex', alignItems: 'center' }}>
                        {[...Array(5)].map((_, i) => (
                           <Star key={i} size={14} fill={i < fb.rating ? "currentColor" : "none"} color="#8B5CF6" />
                        ))}
                      </div>
                    </td>
                    <td className="message-cell">{fb.message}</td>
                    <td>{new Date(fb.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
