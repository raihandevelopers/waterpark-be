const express = require('express');
const { createBooking, verifyPayment, getAllBookings, getUserBookings } = require('../controllers/bookingController');
const authenticate = require('../middleware/authMiddleware'); // Import the middleware
const User = require('../models/User');

const router = express.Router();


const checkAdminRole = async (req, res, next) => {
    console.log(req.user);
    const user = await User.findById(req.user.userId);
    if (user.role !== 'admin') {
        return res.status(403).json({ message: "Permission denied. Admin role required." });
    }
    console.log('Admin role verified');
    next(); // Proceed to the next route handler
};


// Protect routes with authentication 
router.post('/create', authenticate, createBooking);
router.post('/verify', authenticate, verifyPayment);
router.get('/all', authenticate,checkAdminRole, getAllBookings); // Optional: Protect admin-only routes
router.post('/user', authenticate, getUserBookings);

module.exports = router;
