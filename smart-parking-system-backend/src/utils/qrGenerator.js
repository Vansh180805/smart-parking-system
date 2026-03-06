const QRCode = require('qrcode');

// Generate QR code as data URL
const generateQRCode = async (data) => {
  try {
    const qrCode = await QRCode.toDataURL(JSON.stringify(data), {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
    return qrCode;
  } catch (error) {
    console.error('QR Code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
};

// Generate QR code as Buffer (for saving to file)
const generateQRCodeBuffer = async (data) => {
  try {
    const qrCode = await QRCode.toBuffer(JSON.stringify(data), {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
    return qrCode;
  } catch (error) {
    console.error('QR Code buffer generation error:', error);
    throw new Error('Failed to generate QR code');
  }
};

// Generate booking QR code with booking details
const generateBookingQR = async (booking) => {
  const qrData = {
    type: 'booking',
    bookingId: booking.bookingId,
    userId: booking.userId,
    parkingId: booking.parkingId,
    slotId: booking.slotId,
    vehicleNumber: booking.vehicleNumber,
    timestamp: new Date().toISOString(),
  };

  return generateQRCode(qrData);
};

// Generate verification token for staff scanning
const generateVerificationQR = async (bookingId, token) => {
  const qrData = {
    type: 'verification',
    bookingId,
    token,
    timestamp: new Date().toISOString(),
  };

  return generateQRCode(qrData);
};

module.exports = {
  generateQRCode,
  generateQRCodeBuffer,
  generateBookingQR,
  generateVerificationQR,
};
