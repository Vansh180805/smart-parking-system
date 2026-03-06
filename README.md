# Smart Vehicle Parking Slot Booking System 🅿️

A complete MERN stack application for smart parking lot management with real-time slot visualization, OTP-based authentication, advanced analytics, and automated fine calculations.

## Features ✨

### User Features
- **OTP-based Authentication**: Secure signup and login with email verification
- **Real-time Slot Visualization**: Interactive grid showing available, occupied, and reserved slots
- **Nearby Parking Search**: Find parking lots within 5km using geolocation
- **Smart Booking**: Select vehicle type, time, and specific parking slot
- **QR Code Payment**: Simulate payment with generated booking QR codes
- **Booking History**: Track all past and upcoming bookings
- **Vehicle Categories**: Support for 2W, 3W, 4W, and Heavy vehicles with distinct slots

### Staff Features
- **QR Verification**: Verify vehicle entry by scanning booking QR codes
- **Pending Entries Management**: View and verify pending bookings
- **Parked Vehicles Tracking**: Monitor currently parked vehicles
- **Unpark Management**: Mark vehicles as unparked and calculate fines

### Admin Features
- **Advanced Analytics Dashboard**: 7+ different chart visualizations
- **Real-time Metrics**: 
  - Vehicles parked today
  - Active bookings
  - Revenue collection
  - Fines collected
  - Occupancy rates
  - Available slots
- **Revenue Analytics**: Daily breakdown of booking vs fine revenue
- **Booking Trends**: Daily total/completed/cancelled bookings
- **Vehicle Distribution**: Pie chart by vehicle type
- **Parking Performance**: Compare occupancy and revenue across lots
- **Hourly Trends**: 24-hour parking activity heatmap

### System Features
- **Overstay Detection**: Automatic detection and fine calculation
- **Email Notifications**: 
  - OTP verification
  - Booking confirmation
  - Parking confirmation
  - Overstay notifications
  - Password reset
- **Role-based Access Control**: User, Staff, Admin roles with secure JWT auth
- **Geolocation**: Haversine formula for accurate distance calculation
- **Database Indexing**: Optimized MongoDB queries with compound and geospatial indexes
- **Error Handling**: Comprehensive error handling with meaningful messages

## Tech Stack 🛠️

### Backend
- **Node.js** - Server runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **Bcrypt** - Password hashing
- **JWT** - Authentication tokens
- **Nodemailer** - Email service
- **QRCode** - QR code generation

### Frontend
- **React.js** - UI framework
- **React Router** - Navigation
- **Context API** - State management
- **Axios** - HTTP client
- **Recharts** - Data visualization
- **CSS3** - Styling with animations

## Project Structure 📁

### Backend
```
smart-parking-system-backend/
├── src/
│   ├── server.js           # Express server setup
│   ├── config/
│   │   └── db.js          # MongoDB connection
│   ├── models/
│   │   ├── User.js        # User schema with OTP fields
│   │   ├── ParkingLot.js  # Parking location data
│   │   ├── Slot.js        # Individual parking slots
│   │   ├── Booking.js     # Booking lifecycle
│   │   └── Payment.js     # Transaction tracking
│   ├── controllers/
│   │   ├── authController.js      # Authentication logic
│   │   ├── bookingController.js   # Booking management
│   │   ├── parkingController.js   # Parking CRUD & stats
│   │   ├── staffController.js     # Staff verification
│   │   └── adminController.js     # Analytics endpoints
│   ├── routes/
│   │   ├── authRoutes.js    # Auth endpoints
│   │   ├── bookingRoutes.js # Booking endpoints
│   │   ├── parkingRoutes.js # Parking endpoints
│   │   ├── staffRoutes.js   # Staff endpoints
│   │   └── adminRoutes.js   # Admin analytics
│   ├── middleware/
│   │   └── authMiddleware.js  # JWT & RBAC
│   └── utils/
│       ├── emailSender.js     # Email templates
│       ├── otpUtil.js         # OTP generation
│       ├── qrGenerator.js     # QR code creation
│       └── locationUtil.js    # Distance calculation
└── package.json
```

### Frontend
```
smart-parking-system-frontend/
├── src/
│   ├── App.js               # Main app with routing
│   ├── pages/
│   │   ├── Auth/
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── Admin/
│   │   │   └── AdminDashboard.jsx
│   │   ├── User/
│   │   │   ├── UserHome.jsx
│   │   │   └── UserParking.jsx
│   │   └── Staff/
│   │       └── StaffDashboard.jsx
│   ├── components/
│   │   └── SlotGrid.jsx      # Slot visualization
│   ├── context/
│   │   └── AuthContext.js    # Auth state management
│   ├── services/
│   │   └── api.js            # API service layer
│   └── styles/
│       ├── Auth.css
│       ├── AdminDashboard.css
│       ├── UserHome.css
│       ├── UserParking.css
│       ├── SlotGrid.css
│       └── StaffDashboard.css
└── package.json
```

## Installation & Setup 🚀

### Backend Setup

1. **Clone and Install**
```bash
cd smart-parking-system-backend
npm install
```

2. **Environment Configuration**
Create `.env` file:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/parking_system
JWT_SECRET=your_super_secret_jwt_key_12345
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password
CORS_ORIGIN=http://localhost:3000
```

3. **MongoDB Setup**
```bash
# Using MongoDB Atlas (recommended)
# Update MONGO_URI with your connection string

# Or local MongoDB
mongod
```

4. **Start Backend Server**
```bash
npm start
# Server runs on http://localhost:5000
```

### Frontend Setup

1. **Install Dependencies**
```bash
cd smart-parking-system-frontend
npm install
```

2. **Start Development Server**
```bash
npm start
# App opens on http://localhost:3000
```

## API Endpoints 📚

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/resend-otp` - Resend OTP
- `POST /api/auth/login` - Login user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Get current user

### Bookings
- `GET /api/bookings/nearest-parking` - Find nearby parking
- `GET /api/bookings/parking/:parkingId/slots` - Get available slots
- `POST /api/bookings/create` - Create booking
- `POST /api/bookings/:bookingId/pay-qr` - Process QR payment
- `GET /api/bookings/my-bookings` - Get user bookings
- `POST /api/bookings/:bookingId/cancel` - Cancel booking
- `GET /api/bookings/:bookingId/check-overstay` - Check overstay

### Parking
- `GET /api/parking/all` - Get all parking lots
- `GET /api/parking/nearby` - Find nearby parking (geospatial)
- `GET /api/parking/:parkingId/details` - Get parking details
- `GET /api/parking/:parkingId/stats` - Get parking statistics
- `POST /api/parking/create` - Create parking (admin only)
- `PUT /api/parking/:parkingId/update` - Update parking (admin only)

### Staff
- `POST /api/staff/verify-parking` - Verify vehicle entry
- `POST /api/staff/mark-unparked/:bookingId` - Mark vehicle as unparked
- `GET /api/staff/pending-entries` - Get pending entries
- `GET /api/staff/parked-vehicles` - Get parked vehicles
- `GET /api/staff/booking/:bookingId` - Get booking details

### Admin Analytics
- `GET /api/admin/dashboard-summary` - KPI metrics
- `GET /api/admin/vehicle-stats` - Vehicle distribution
- `GET /api/admin/revenue-stats` - Daily revenue breakdown
- `GET /api/admin/booking-trends` - Booking trends
- `GET /api/admin/fine-stats` - Fine statistics
- `GET /api/admin/parking-performance` - Parking lot comparison
- `GET /api/admin/hourly-trends` - 24-hour parking trends

## Demo Credentials 👤

### User Account
- **Email**: user@example.com
- **Password**: password123

### Admin Account
- **Email**: admin@example.com
- **Password**: admin123

### Staff Account
- **Email**: staff@example.com
- **Password**: staff123

## Key Features Explained 🔍

### OTP Verification Flow
1. User enters email during registration
2. System generates 6-digit OTP (valid for 10 minutes)
3. OTP sent via email
4. User verifies OTP to complete registration
5. Automatic login after verification

### Booking Process
1. User enables location services
2. App finds nearby parking within 5km
3. User selects parking and vehicle type
4. System fetches available slots
5. User selects slot and duration
6. QR code generated for payment
7. Booking confirmation with QR code

### Staff Verification
1. Staff scans customer's booking QR code
2. System validates QR against active bookings
3. Verifies time window (not too early/late)
4. Marks vehicle as parked
5. Sends confirmation email to customer

### Overstay Detection & Fines
1. System monitors booking end times
2. Detects vehicles beyond end time
3. Calculates fine: `(actual_duration - booked_duration) × hourly_rate`
4. Sends overstay notification email
5. Admin tracks fine collection

### Analytics Dashboard
1. **Today's Metrics**: Real-time KPI cards
2. **Vehicle Distribution**: Pie chart by type
3. **Revenue Breakdown**: Booking vs Fine revenue
4. **Daily Trends**: Line chart for 7-day trends
5. **Booking Trends**: Bar chart (total/completed/cancelled)
6. **Hourly Trends**: 24-hour parking activity
7. **Performance Table**: Parking lot comparison

## Security Features 🔒

- **Password Hashing**: Bcrypt with 10 salt rounds
- **JWT Tokens**: Secure 7-day expiry tokens
- **Role-based Access**: User/Staff/Admin permissions
- **OTP Verification**: 10-minute validity
- **CORS Protection**: Configured origin validation
- **Input Validation**: Server-side validation on all endpoints
- **Error Handling**: Generic errors prevent info leakage

## Database Models 💾

### User Model
```javascript
{
  name: String,
  email: String (unique, indexed),
  phone: String,
  password: String (hashed),
  role: String (user/staff/admin),
  isVerified: Boolean,
  otp: String,
  otpExpires: Date,
  totalBookings: Number,
  totalMoneySpent: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### ParkingLot Model
```javascript
{
  name: String,
  address: String,
  city: String,
  location: GeoJSON Point (2dsphere indexed),
  totalSlots: Number,
  slotsByType: Object,
  hourlyRate: Number,
  maxHours: Number,
  overStayFinePerHour: Number,
  createdBy: ObjectId (Admin reference),
  isActive: Boolean
}
```

### Booking Model
```javascript
{
  bookingId: String (unique),
  userId: ObjectId,
  parkingId: ObjectId,
  slotId: ObjectId,
  vehicleType: String,
  vehicleNumber: String,
  startTime: Date,
  endTime: Date,
  bookingAmount: Number,
  fineAmount: Number,
  totalPaid: Number,
  paymentStatus: String,
  bookingStatus: String,
  qrCode: String,
  isParked: Boolean,
  parkedAt: Date,
  unparkedAt: Date,
  staffVerificationId: ObjectId
}
```

## Performance Optimizations ⚡

- **Database Indexes**: Compound and geospatial indexes for fast queries
- **JWT Caching**: Token validation in middleware
- **Lazy Loading**: Frontend components load on demand
- **API Response Caching**: Reduce database queries
- **Aggregation Pipelines**: Efficient analytics calculations
- **Pagination**: List endpoints support pagination

## Deployment Checklist ✅

- [ ] Set strong `JWT_SECRET`
- [ ] Use production MongoDB Atlas URL
- [ ] Configure Gmail App Password for email
- [ ] Enable HTTPS/SSL
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper CORS origins
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Test all email notifications
- [ ] Load test the system

## Next Steps / Future Enhancements 🚀

- [ ] Payment gateway integration (Razorpay/Stripe)
- [ ] Real-time notifications (WebSocket/Socket.io)
- [ ] Mobile app (React Native)
- [ ] Vehicle registration plate recognition (OCR)
- [ ] Customer support chat
- [ ] Multiple language support
- [ ] Dark mode
- [ ] Advanced reporting
- [ ] Integration with traffic cameras
- [ ] Mobile wallet support

## Troubleshooting 🔧

### MongoDB Connection Error
```bash
# Ensure MongoDB is running
mongod

# Or use MongoDB Atlas with correct connection string
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/parking_system
```

### Email Not Sending
- Enable Less Secure App Access in Gmail
- Use App-specific password for Gmail
- Check Firebase/Nodemailer configuration

### CORS Errors
- Verify `CORS_ORIGIN` matches frontend URL
- Check browser console for exact error
- Ensure credentials are included in requests

### Token Expired
- Clear localStorage
- Login again
- Tokens refresh automatically on page reload

## Contributing 🤝

Contributions welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License 📄

This project is licensed under the MIT License - see LICENSE file for details.

## Support 💬

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact: support@smartparking.com
- Check existing documentation

---

**Built with ❤️ using MERN Stack**

**Last Updated**: 2024
**Status**: Production Ready

