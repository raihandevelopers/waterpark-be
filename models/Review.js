const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    waterparkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Waterpark", // Referencing Waterpark model
      required: true,
    },
    name: { type: String, required: true },
    email: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);
