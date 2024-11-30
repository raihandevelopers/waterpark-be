const express = require('express');
const { createBooking, verifyPayment, getAllBookings, getUserBookings } = require('../controllers/bookingController');
const authenticate = require('../middleware/authMiddleware'); // Import the middleware

const router = express.Router();

// Protect routes with authentication
router.post('/create', authenticate, createBooking);
router.post('/verify', authenticate, verifyPayment);
router.get('/all', authenticate, getAllBookings); // Optional: Protect admin-only routes
router.post('/user', authenticate, getUserBookings);

module.exports = router;
