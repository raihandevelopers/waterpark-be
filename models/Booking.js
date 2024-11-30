const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Reference to User

  waterpark: { type: mongoose.Schema.Types.ObjectId, ref: "Waterpark" },
  waterparkName: String,
  paymentType: String,
  name: String,
  email: String,
  phone: String,
  date: Date,
  bookingDate : Date,
  adults: Number,
  children: Number,
  adultPrice: Number, // Adult price per person
  childPrice: Number, // Child price per person
  discountPercentage: Number, // Discount percentage applied
  totalPrice: Number, // Final total price after discounts
  paymentId: String,
  paymentStatus: { type: String, default: "Pending" },
});

module.exports = mongoose.model("Booking", bookingSchema);
