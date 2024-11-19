const Booking = require('../models/Booking');
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create a booking
exports.createBooking = async (req, res) => {
  const { waterpark, name, email, phone, date, adults, children, totalPrice } = req.body;

  try {
    const booking = await Booking.create({ waterpark, name, email, phone, date, adults, children, totalPrice });
    const options = {
      amount: totalPrice * 100, // Convert to paise
      currency: 'INR',
      receipt: booking._id.toString(),
    };

    const order = await razorpay.orders.create(options);
    res.status(201).json({ booking, order });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Verify payment and update booking
exports.verifyPayment = async (req, res) => {
  const { bookingId, paymentId } = req.body;

  try {
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { paymentId, paymentStatus: 'Completed' },
      { new: true }
    );
    res.status(200).json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
