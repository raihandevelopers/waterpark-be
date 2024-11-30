const Review = require("../models/Review");

exports.getReviews = async (req, res) => {
  const { waterparkId } = req.params;

  try {
    const reviews = await Review.find({ waterparkId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, reviews });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ success: false, message: "Failed to fetch reviews." });
  }
};

exports.addReview = async (req, res) => {
  const { waterparkId, name, email, rating, review } = req.body;

  try {
    const newReview = new Review({
      waterparkId,
      name,
      email,
      rating,
      review,
    });

    await newReview.save();
    res.status(201).json({ success: true, message: "Review added successfully.", review: newReview });
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({ success: false, message: "Failed to add review." });
  }
};
