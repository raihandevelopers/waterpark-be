const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  waterpark: { type: mongoose.Schema.Types.ObjectId, ref: 'Waterpark' },
  waterparkName: String,
  paymentType: String,
  name: String,
  email: String,
  phone: String,
  date: Date,
  adults: Number,
  children: Number,
  totalPrice: Number,
  paymentId: String,
  paymentStatus: { type: String, default: 'Pending' },
});

module.exports = mongoose.model('Booking', bookingSchema);
