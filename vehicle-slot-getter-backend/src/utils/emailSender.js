const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'parking@smartvehicle.com',
      to,
      subject,
      html,
    };
    const result = await transporter.sendMail(mailOptions);
    return { success: true, result };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

// Send OTP email
const sendOTPEmail = async (email, otp) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Email Verification OTP</h2>
      <p>Your One-Time Password (OTP) for email verification is:</p>
      <h1 style="color: #007bff; text-align: center; letter-spacing: 2px;">${otp}</h1>
      <p>This OTP is valid for 10 minutes only.</p>
      <p>If you didn't request this OTP, please ignore this email.</p>
      <hr>
      <p style="color: #666; font-size: 12px;">Smart Vehicle Parking System</p>
    </div>
  `;
  
  return sendEmail({
    to: email,
    subject: 'Email Verification OTP',
    html,
  });
};

// Send booking confirmation email
const sendBookingConfirmation = async (booking, user, parking, slot) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Parking Slot Booked Successfully! ✅</h2>
      <p>Hi <strong>${user.name}</strong>,</p>
      <p>Your parking slot has been successfully booked. Here are your booking details:</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
        <p><strong>Parking Location:</strong> ${parking.name}, ${parking.address}</p>
        <p><strong>Slot Number:</strong> ${slot.slotNumber}</p>
        <p><strong>Vehicle Type:</strong> ${booking.vehicleType}</p>
        <p><strong>Vehicle Number:</strong> ${booking.vehicleNumber}</p>
        <p><strong>Booking Date:</strong> ${new Date(booking.startTime).toLocaleDateString()}</p>
        <p><strong>Check-in Time:</strong> ${new Date(booking.startTime).toLocaleTimeString()}</p>
        <p><strong>Check-out Time:</strong> ${new Date(booking.endTime).toLocaleTimeString()}</p>
        <p><strong>Total Amount:</strong> ₹${booking.bookingAmount}</p>
      </div>

      <p><strong>Next Steps:</strong></p>
      <ol>
        <li>Complete the payment using the QR code provided in the app</li>
        <li>Show your booking QR code at the parking entrance</li>
        <li>Staff will verify and grant you access</li>
      </ol>

      <p>
        <a href="https://maps.google.com/?q=${parking.location.coordinates[1]},${parking.location.coordinates[0]}" 
           style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 3px;">
          Open in Google Maps
        </a>
      </p>

      <hr style="margin: 30px 0;">
      <p style="color: #666; font-size: 12px;">
        Smart Vehicle Parking System<br>
        Questions? Reply to this email for support.
      </p>
    </div>
  `;
  
  return sendEmail({
    to: user.email,
    subject: 'Parking Slot Booked Successfully - ' + booking.bookingId,
    html,
  });
};

// Send parking confirmation email
const sendParkingConfirmation = async (booking, user, parking, slot) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>You're Parked! 🎉</h2>
      <p>Hi <strong>${user.name}</strong>,</p>
      <p>Your vehicle has been successfully parked at our facility.</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Parking Location:</strong> ${parking.name}</p>
        <p><strong>Slot Number:</strong> ${slot.slotNumber}</p>
        <p><strong>Vehicle Number:</strong> ${booking.vehicleNumber}</p>
        <p><strong>Parked At:</strong> ${new Date(booking.parkedAt).toLocaleTimeString()}</p>
        <p><strong>Expected Check-out:</strong> ${new Date(booking.endTime).toLocaleTimeString()}</p>
      </div>

      <p style="color: #28a745;"><strong>✓ Entry verified and confirmed.</strong></p>

      <hr style="margin: 30px 0;">
      <p style="color: #666; font-size: 12px;">
        Safe parking! Smart Vehicle Parking System
      </p>
    </div>
  `;
  
  return sendEmail({
    to: user.email,
    subject: 'Parking Confirmed - ' + booking.bookingId,
    html,
  });
};

// Send overstay fine notification
const sendOverstayNotification = async (booking, user, parking, fineAmount) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc3545;">⚠️ Overstay Fine Notice</h2>
      <p>Hi <strong>${user.name}</strong>,</p>
      <p>Your parking time has exceeded the booked duration.</p>
      
      <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
        <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
        <p><strong>Parking Location:</strong> ${parking.name}</p>
        <p><strong>Slot Number:</strong> Slot${booking.slotId}</p>
        <p><strong>Booked until:</strong> ${new Date(booking.endTime).toLocaleTimeString()}</p>
        <p style="color: #dc3545;"><strong>Fine Amount: ₹${fineAmount}</strong></p>
      </div>

      <p>Please make payment for the overstay fine immediately to avoid further action.</p>

      <hr style="margin: 30px 0;">
      <p style="color: #666; font-size: 12px;">
        Smart Vehicle Parking System
      </p>
    </div>
  `;
  
  return sendEmail({
    to: user.email,
    subject: 'Overstay Fine Notice - ' + booking.bookingId,
    html,
  });
};

// Send password reset OTP
const sendPasswordResetOTP = async (email, otp) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Reset Your Password</h2>
      <p>We received a request to reset your password.</p>
      <p>Your One-Time Password (OTP) is:</p>
      <h1 style="color: #007bff; text-align: center; letter-spacing: 2px;">${otp}</h1>
      <p>This OTP is valid for 10 minutes only.</p>
      <p style="color: #dc3545;"><strong>Do not share this OTP with anyone.</strong></p>
      <p>If you didn't request this, please ignore this email.</p>
      <hr>
      <p style="color: #666; font-size: 12px;">Smart Vehicle Parking System</p>
    </div>
  `;
  
  return sendEmail({
    to: email,
    subject: 'Password Reset OTP',
    html,
  });
};

module.exports = {
  sendEmail,
  sendOTPEmail,
  sendBookingConfirmation,
  sendParkingConfirmation,
  sendOverstayNotification,
  sendPasswordResetOTP,
};module.exports = sendEmail;
