const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");

// Fetch reviews for a specific waterpark
router.get("/:waterparkId", reviewController.getReviews);

// Add a review for a specific waterpark
router.post("/", reviewController.addReview);

module.exports = router;
