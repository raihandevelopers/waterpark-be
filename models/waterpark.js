const mongoose = require("mongoose");

const waterparkSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    included: { type: [String], required: true },
    excluded: { type: [String], required: true },
    map: { type: String, required: true },
    adultPrice: { type: Number, required: true }, // Adult price per person
    childPrice: { type: Number, required: true }, // Child price per person
    discountPercentage: { type: Number, default: 0 }, // Discount percentage
    discountedPrice: { type: Number}, // Discount percentage
    adultDiscountedPrice: { type: Number }, // Calculated discounted price for adults
    childDiscountedPrice: { type: Number }, // Calculated discounted price for children
    advanceAmount: { type: Number, required: true }, // Advance per person
    weekendPriceIncrease: { type: Number, default: 0 }, // Normal number increase for weekends
    faqs: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
      },
    ],
    images: { type: [String] }, // Store paths of uploaded images
  },
  { timestamps: true }
);

module.exports = mongoose.model("Waterpark", waterparkSchema);
