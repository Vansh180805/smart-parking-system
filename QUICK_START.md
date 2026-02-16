# Quick Start Guide - Smart Vehicle Parking System 🚀

Get the complete MERN parking system running in just 15 minutes!

## Prerequisites

Ensure you have installed:
- **Node.js** v14+ (with npm)
- **MongoDB** v4.4+ (or MongoDB Atlas account)
- **Git** (optional, for cloning)
- **A modern web browser** (Chrome, Firefox, Safari, Edge)

## Step 1: Backend Setup (5 minutes)

### 1a. Navigate to Backend Directory
```bash
cd vehicle-slot-getter-backend
npm install
```

### 1b. Create .env File
Create a file named `.env` in the backend root directory:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/parking_system
JWT_SECRET=parking_system_secret_key_12345_change_in_production
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password
CORS_ORIGIN=http://localhost:3000
```

### 1c. Start MongoDB
**On Windows:**
```bash
mongod
```

**On Mac/Linux:**
```bash
brew services start mongodb-community
```

**Or use MongoDB Atlas (Cloud):**
Replace `MONGO_URI` with your cloud connection string

### 1d. Start Backend Server
```bash
npm start
```

Expected output:
```
✅ MongoDB Connected!
✅ Server running on http://localhost:5000
```

## Step 2: Frontend Setup (5 minutes)

### 2a. Navigate to Frontend Directory
```bash
cd vehicle-slot-getter-frontend
npm install
```

### 2b. Start Frontend Development Server
```bash
npm start
```

The app automatically opens at `http://localhost:3000`

Expected output:
```
✅ Compiled successfully!
You can now view parking-system in the browser.
```

## Step 3: Test the Application (5 minutes)

### Testing with Demo Account

#### As a User:
1. **Login Page**
   - URL: `http://localhost:3000/login`
   - Email: `user@example.com`
   - Password: `password123`
   - Click "Sign In"

2. **User Dashboard**
   - Welcome message with personalized greeting
   - Quick stats section
   - Quick action cards

3. **Book a Parking**
   - Click "Book a Slot" or navigate to `/bookings`
   - Allow location access when prompted
   - See nearby parking lots
   - Select parking → select slot → complete booking

#### As Admin:
1. **Login**
   - Email: `admin@example.com`
   - Password: `admin123`

2. **View Dashboard**
   - Navigate to `/admin/dashboard`
   - See analytics with 7 different charts
   - View KPI cards with metrics
   - See parking performance table

#### As Staff:
1. **Login**
   - Email: `staff@example.com`
   - Password: `staff123`

2. **Verify Parking**
   - Navigate to `/staff/dashboard`
   - See pending entries needing verification
   - Tab through pending/parked/verify QR modes
   - Click "Verify Entry" on pending bookings

## Step 4: Common Issues & Solutions

### Issue: MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:**
- Ensure MongoDB is running
- Check connection string in .env
- If using MongoDB Atlas, verify IP whitelist includes your machine

### Issue: Port Already in Use
```
Error: listen EADDRINUSE :::5000
```
**Solution:**
```bash
# Change port in .env
PORT=5001

# Or kill the process using port 5000
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :5000
kill -9 <PID>
```

### Issue: CORS Error
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution:**
- Check `CORS_ORIGIN` matches your frontend URL
- Restart backend server after changing .env

### Issue: Emails Not Sending
```
Error: Invalid login: 535-5.7.8 Username and password not accepted
```
**Solution:**
- Use Gmail App Password (not regular password)
- Enable Less Secure App Access
- Verify EMAIL_USER and EMAIL_PASS in .env

### Issue: .env Variables Not Loading
**Solution:**
- Restart backend server
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Ensure .env file is in the root directory (vehicle-slot-getter-backend)

## File Structure Quick Reference

```
📦 vehicle-slot-getter/
├── 📁 vehicle-slot-getter-backend/
│   ├── .env                    ← Your config file
│   ├── src/
│   │   ├── server.js          ← Main server
│   │   ├── models/            ← Database schemas
│   │   ├── controllers/       ← Business logic
│   │   ├── routes/            ← API endpoints
│   │   └── utils/             ← Helper functions
│   └── package.json
│
└── 📁 vehicle-slot-getter-frontend/
    ├── src/
    │   ├── pages/             ← React pages
    │   ├── components/        ← React components
    │   ├── services/          ← API calls
    │   ├── context/           ← State management
    │   ├── styles/            ← CSS files
    │   └── App.js             ← Main app
    └── package.json
```

## Available Routes

### Frontend Routes
```
/login                    → Login page
/register                 → Registration with OTP
/bookings                 → Booking interface (user)
/home                     → User dashboard
/admin/dashboard          → Admin analytics
/staff/dashboard          → Staff verification panel
```

### Backend API Routes
```
POST /api/auth/register           → Create user account
POST /api/auth/verify-otp         → Verify OTP
POST /api/auth/login              → User login
GET /api/bookings/nearest-parking → Find nearby lots
POST /api/bookings/create         → Create booking
GET /api/admin/dashboard-summary  → Admin KPIs
GET /api/staff/pending-entries    → Staff pending
```

## Development Tips 💡

### Enable Console Logging
Add this to see detailed logs:
```javascript
// In frontend (.env or App.js)
REACT_APP_DEBUG=true

// In backend (server.js)
console.log('Detailed logs here');
```

### Test with Different Cities
Modify booking location in browser:
```javascript
// In browser console
navigator.geolocation.getCurrentPosition = function(success) {
  success({
    coords: {
      latitude: 19.0760, // Mumbai example
      longitude: 72.8777
    }
  });
};
```

### Disable Email Notifications (for testing)
Comment out email sending in controllers:
```javascript
// await emailSender.sendOTPEmail(...);
// Email temporarily disabled for testing
```

### View Database Records
```bash
# Open MongoDB shell
mongosh

# Select database
use parking_system

# View collections
show collections

# View users
db.users.find()

# View bookings
db.bookings.find()

# Clear collection (careful!)
db.bookings.deleteMany({})
```

## Performance Tips 🚀

1. **Frontend Optimization**
   - Run `npm run build` for production
   - Serve static files with gzip
   - Use lazy loading for routes

2. **Backend Optimization**
   - Enable MongoDB compression
   - Add database indexes (already done)
   - Cache frequently accessed data

3. **Network Optimization**
   - Enable gzip compression
   - Minimize API calls
   - Use pagination for lists

## Testing Checklist ✅

### Authentication
- [ ] Register new user with OTP
- [ ] Resend OTP
- [ ] Login with credentials
- [ ] Logout successfully
- [ ] Redirect to login when token expires

### Booking
- [ ] Find nearby parking
- [ ] View parking slots
- [ ] Create booking
- [ ] See booking in history
- [ ] Cancel booking

### Admin
- [ ] View dashboard
- [ ] See all 7 charts
- [ ] View KPI cards
- [ ] Check parking performance

### Staff
- [ ] View pending entries
- [ ] Verify vehicle entry
- [ ] See parked vehicles
- [ ] Mark vehicle as unparked

## Useful Commands

```bash
# Backend
npm install              # Install dependencies
npm start               # Start server
npm run dev             # Start with nodemon
npm test                # Run tests (if configured)

# Frontend
npm install             # Install dependencies
npm start               # Start dev server
npm run build           # Create production build
npm test                # Run tests
npm eject               # Expose config (careful!) 

# Git
git status              # Check modifications
git add .               # Stage changes
git commit -m "message" # Commit changes
git push                # Push to remote
```

## API Testing with Postman

1. **Import Collection**
   - File → Import → Select backend folder
   - Creates all endpoints

2. **Set up Environment**
   - Environment Variables
   - Add `base_url`: http://localhost:5000/api
   - Add `token`: (Get from login response)

3. **Test Endpoints**
   - Click endpoint
   - Set request body
   - Send request
   - Check response

## Troubleshooting Deployment

### For Vercel (Frontend)
```bash
vercel login
vercel
# Follow prompts
```

### For Heroku (Backend)
```bash
heroku login
heroku create parking-system-api
git push heroku main
heroku config:set MONGO_URI=your_cloud_uri
```

## Need Help? 🆘

1. **Check Console**
   - Browser DevTools (F12)
   - Backend terminal output
   - MongoDB logs

2. **Common Solutions**
   - Restart servers
   - Clear browser cache
   - Clear node_modules and reinstall
   - Check .env configuration

3. **Debug Mode**
   - Inspect network requests
   - Check database with MongoDB Compass
   - Use console.log extensively
   - Check email service configuration

## Success Confirmation ✨

You're all set when you see:

**Backend:**
```
✅ MongoDB Connected!
✅ Server running on http://localhost:5000
```

**Frontend:**
```
Compiled successfully!
You can now view vehicle-slot-getter-frontend in the browser.
```

**Browser:**
- Login page loads
- Can login with demo credentials  
- Dashboard loads without errors
- Can navigate between pages

---

## Next Steps

1. **Read Documentation**: Check README.md for detailed info
2. **Explore Features**: Try all user flows
3. **Integrate Payment**: Add real Razorpay integration
4. **Deploy**: Push to production servers
5. **Monitor**: Set up error tracking and monitoring

**Happy Parking! 🅿️**

For detailed information, see:
- `README.md` - Complete documentation
- `FRONTEND_COMPLETION_SUMMARY.md` - What was built

Last Updated: 2024
