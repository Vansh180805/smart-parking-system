const express = require('express');
const router = express.Router();
const parkingController = require('../controllers/parkingController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Public routes
router.get('/all', parkingController.getAllParking);
router.get('/nearby', parkingController.getNearbyParking);
router.get('/:parkingId/details', parkingController.getParkingDetails);
router.get('/:parkingId/stats', parkingController.getParkingStats);
router.get('/:id/slots', parkingController.getSlotsByParking);

// Admin routes
router.post('/create', authMiddleware(['admin']), parkingController.createParking);
router.put('/:parkingId/update', authMiddleware(['admin']), parkingController.updateParking);

module.exports = router;
