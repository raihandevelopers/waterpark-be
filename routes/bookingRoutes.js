const express = require('express');
const { createBooking, verifyPayment } = require('../controllers/bookingController');
const router = express.Router();

router.post('/create', createBooking);
router.post('/verify', verifyPayment);

module.exports = router;
