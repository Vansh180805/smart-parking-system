const mongoose = require('mongoose');
require('dotenv').config();

const BookingSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    bookingStatus: String
}, { strict: false });

const UserSchema = new mongoose.Schema({
    name: String
}, { strict: false });

const User = mongoose.model('User', UserSchema);
const Booking = mongoose.model('Booking', BookingSchema);

async function checkBookings() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ name: /Shivanshu/i });
    if (!user) {
      console.log('User not found');
      return;
    }

    const allBookings = await Booking.find({ userId: user._id });
    console.log(`User: ${user.name}`);
    console.log(`Total Bookings: ${allBookings.length}`);
    
    const breakdown = {};
    allBookings.forEach(b => {
        breakdown[b.bookingStatus] = (breakdown[b.bookingStatus] || 0) + 1;
    });
    console.log('Breakdown:', breakdown);

    const active = allBookings.filter(b => ['pending', 'confirmed', 'parked', 'overdue'].includes(b.bookingStatus));
    console.log(`Active Bookings: ${active.length}`);

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

checkBookings();
