const mongoose = require('mongoose');

const waterparkSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  included: { type: [String], required: true },
  excluded: { type: [String], required: true },
  map: { type: String, required: true },
  price: { type: Number, required: true },
  discountPrice: { type: Number }, // Optional
  advanceAmount: { type: Number, required: true }, // Advance per person
  weekendPriceIncrease: { type: Number, default: 0 }, // Percentage increase for weekends
  faqs: [
    {
      question: { type: String, required: true },
      answer: { type: String, required: true },
    },
  ],
  images: { type: [String] }, // Store paths of uploaded images
}, { timestamps: true });

module.exports = mongoose.model('Waterpark', waterparkSchema);
