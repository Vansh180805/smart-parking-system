const QRCode = require('qrcode');

const bookingData = JSON.stringify({
  slot: "SLOT-1",
  slotId: "692821f840632a9122f9e85d",
  user: "692814bea2637ca468a70a05",
  time: new Date().toISOString()
});

// Generate QR image
QRCode.toFile("ticket.png", bookingData, function (err) {
  if (err) throw err;
  console.log("✅ QR generated as ticket.png");
});
