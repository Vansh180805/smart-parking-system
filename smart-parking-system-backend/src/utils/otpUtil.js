// Generate random 6-digit OTP
const generateOTP = () => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  return otp;
};

// Generate OTP expiry (10 minutes)
const getOTPExpiry = () => {
  return new Date(Date.now() + 10 * 60 * 1000);
};

// Verify OTP
const verifyOTP = (storedOTP, providedOTP, otpExpiry) => {
  if (!storedOTP || !providedOTP) {
    return { valid: false, message: 'OTP not provided' };
  }

  if (new Date() > otpExpiry) {
    return { valid: false, message: 'OTP has expired' };
  }

  if (storedOTP !== providedOTP) {
    return { valid: false, message: 'Invalid OTP' };
  }

  return { valid: true, message: 'OTP verified successfully' };
};

module.exports = {
  generateOTP,
  getOTPExpiry,
  verifyOTP,
};
