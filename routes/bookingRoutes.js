const express = require('express');
const { createBooking, verifyPayment,getAllBookings } = require('../controllers/bookingController');
const router = express.Router();

router.post('/create', createBooking);
router.post('/verify', verifyPayment);
router.get('/all', getAllBookings);

module.exports = router;
