const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const ParkingLot = require('../models/ParkingLot');
const Slot = require('../models/Slot');
const User = require('../models/User');

// @desc    Get dashboard summary
// @route   GET /api/admin/dashboard-summary
// @access  Private/Admin
exports.getDashboardSummary = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Total Revenue (All time)
    const allTimeRevenueResult = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
        },
      },
      {
        $group: {
          _id: null,
          totalBookingRevenue: {
            $sum: { $cond: [{ $eq: ['$paymentType', 'booking'] }, '$amount', 0] },
          },
          totalFineRevenue: {
            $sum: { $cond: [{ $eq: ['$paymentType', 'fine'] }, '$amount', 0] },
          },
        },
      },
    ]);

    const totalBookingRevenue = allTimeRevenueResult.length > 0 ? allTimeRevenueResult[0].totalBookingRevenue : 0;
    const totalFineRevenue = allTimeRevenueResult.length > 0 ? allTimeRevenueResult[0].totalFineRevenue : 0;
    const totalRevenue = totalBookingRevenue + totalFineRevenue;

    // Total Bookings
    const totalBookings = await Booking.countDocuments();

    // Occupancy Stats
    const totalSlots = await Slot.countDocuments();
    const occupiedSlots = await Slot.countDocuments({
      status: { $in: ['occupied', 'reserved'] },
    });
    const occupancyPercentage = totalSlots > 0 ? ((occupiedSlots / totalSlots) * 100).toFixed(2) : 0;

    // Today's stats
    const vehiclesParkedToday = await Booking.countDocuments({
      bookingStatus: { $in: ['parked', 'completed'] },
      parkedAt: { $gte: today },
    });

    return res.status(200).json({
      success: true,
      data: {
        totalBookingRevenue,
        totalFineRevenue,
        totalRevenue,
        totalBookings,
        occupiedSlots,
        availableSlots: totalSlots - occupiedSlots,
        occupancyPercentage,
        vehiclesParkedToday,
        totalSlots
      },
    });
  } catch (error) {
    console.error('Get dashboard summary error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get vehicle type statistics
// @route   GET /api/admin/vehicle-stats
// @access  Private/Admin
exports.getVehicleStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let matchQuery = { bookingStatus: 'completed' };

    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    const vehicleStats = await Booking.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$vehicleType',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // Convert to percentage
    const totalBookings = vehicleStats.reduce((sum, stat) => sum + stat.count, 0);

    const stats = vehicleStats.map((stat) => ({
      vehicleType: stat._id,
      count: stat.count,
      percentage: ((stat.count / totalBookings) * 100).toFixed(2),
    }));

    return res.status(200).json({
      success: true,
      data: {
        totalBookings,
        byType: stats,
      },
    });
  } catch (error) {
    console.error('Get vehicle stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get revenue statistics
// @route   GET /api/admin/revenue-stats
// @access  Private/Admin
exports.getRevenueStats = async (req, res) => {
  try {
    const { days = 7 } = req.query;

    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - parseInt(days));

    // Daily revenue
    const dailyRevenue = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: dateFrom },
          status: 'completed',
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          bookingRevenue: {
            $sum: {
              $cond: [{ $eq: ['$paymentType', 'booking'] }, '$amount', 0],
            },
          },
          fineRevenue: {
            $sum: {
              $cond: [{ $eq: ['$paymentType', 'fine'] }, '$amount', 0],
            },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Total summary
    const totalBookingRevenue = dailyRevenue.reduce((sum, day) => sum + day.bookingRevenue, 0);
    const totalFineRevenue = dailyRevenue.reduce((sum, day) => sum + day.fineRevenue, 0);

    return res.status(200).json({
      success: true,
      data: {
        period: `Last ${days} days`,
        totalBookingRevenue,
        totalFineRevenue,
        totalRevenue: totalBookingRevenue + totalFineRevenue,
        dailyBreakdown: dailyRevenue,
      },
    });
  } catch (error) {
    console.error('Get revenue stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get booking trends
// @route   GET /api/admin/booking-trends
// @access  Private/Admin
exports.getBookingTrends = async (req, res) => {
  try {
    const { days = 7 } = req.query;

    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - parseInt(days));

    const trends = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: dateFrom },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          totalBookings: { $sum: 1 },
          completedBookings: {
            $sum: {
              $cond: [{ $eq: ['$bookingStatus', 'completed'] }, 1, 0],
            },
          },
          cancelledBookings: {
            $sum: {
              $cond: [{ $eq: ['$bookingStatus', 'cancelled'] }, 1, 0],
            },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        period: `Last ${days} days`,
        trends,
      },
    });
  } catch (error) {
    console.error('Get booking trends error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get fine statistics
// @route   GET /api/admin/fine-stats
// @access  Private/Admin
exports.getFineStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let matchQuery = { paymentType: 'fine', status: 'completed' };

    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    // Total fines
    const fineStats = await Payment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalFines: { $sum: '$amount' },
          totalFineCount: { $sum: 1 },
          averageFine: { $avg: '$amount' },
        },
      },
    ]);

    // Bookings with fines
    const bookedingsWithFines = await Booking.countDocuments({
      fineAmount: { $gt: 0 },
    });

    return res.status(200).json({
      success: true,
      data:
        fineStats.length > 0
          ? {
            ...fineStats[0],
            bookingsWithFines: bookedingsWithFines,
          }
          : {
            totalFines: 0,
            totalFineCount: 0,
            averageFine: 0,
            bookingsWithFines: 0,
          },
    });
  } catch (error) {
    console.error('Get fine stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get parking lot performance
// @route   GET /api/admin/parking-performance
// @access  Private/Admin
exports.getParkingPerformance = async (req, res) => {
  try {
    const parkingLots = await ParkingLot.find({ isActive: true });

    const performance = await Promise.all(
      parkingLots.map(async (parking) => {
        const slots = await Slot.find({ parkingId: parking._id });
        const bookings = await Booking.find({ parkingId: parking._id });

        const occupiedSlots = slots.filter((s) => s.status === 'occupied').length;
        const totalBookings = bookings.length;
        const completedBookings = bookings.filter((b) => b.bookingStatus === 'completed').length;

        return {
          parkingId: parking._id,
          parkingName: parking.name,
          totalSlots: parking.totalSlots,
          occupiedSlots,
          occupancyRate: ((occupiedSlots / parking.totalSlots) * 100).toFixed(2),
          totalBookings,
          completedBookings,
          revenue: bookings.reduce((sum, b) => sum + (b.totalPaid || 0), 0),
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: performance.length,
      data: performance.sort((a, b) => b.revenue - a.revenue),
    });
  } catch (error) {
    console.error('Get parking performance error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get hourly parking trends
// @route   GET /api/admin/hourly-trends
// @access  Private/Admin
exports.getHourlyTrends = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const hourlyData = await Booking.aggregate([
      {
        $match: {
          parkedAt: { $gte: today, $lt: tomorrow },
        },
      },
      {
        $group: {
          _id: {
            $hour: '$parkedAt',
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Fill missing hours with 0
    const hourlyTrends = [];
    for (let hour = 0; hour < 24; hour++) {
      const found = hourlyData.find((d) => d._id === hour);
      hourlyTrends.push({
        hour: `${hour}:00`,
        vehicles: found ? found.count : 0,
      });
    }

    return res.status(200).json({
      success: true,
      data: hourlyTrends,
    });
  } catch (error) {
    console.error('Get hourly trends error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};
