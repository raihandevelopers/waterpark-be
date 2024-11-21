const express = require('express');
const { createBooking, verifyPayment,getAllBookings,getUserBookings } = require('../controllers/bookingController');
const router = express.Router();

router.post('/create', createBooking);
router.post('/verify', verifyPayment);
router.get('/all', getAllBookings);
router.post('/getUserBookings', getUserBookings);
module.exports = router;