const express = require("express");
const router = express.Router();
const Review = require("../Models/review");
const Listing = require("../Models/listing");
const Booking = require("../Models/booking");
const { protect } = require("../middlewares/authenticate");

// GET: Paginated Reviews for a Listing
router.get("/:id/reviews", async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 5;

    const reviews = await Review.find({ listing: id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("user", "name");

    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
});

// POST: Add a Review
router.post("/:id/reviews", protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const listingId = req.params.id;

    const listing = await Listing.findById(listingId);
    if (!listing)
      return res.status(404).json({ message: "Listing not found" });

    // Ensure user has stayed
    const hasStayed = await Booking.findOne({
      guest: req.user.id,
      listing: listingId,
      checkOut: { $lt: new Date() },
    });

    if (!hasStayed) {
      return res
        .status(400)
        .json({ message: "You can only review after your stay" });
    }

    const review = await Review.create({
      listing: listingId,
      user: req.user.id,
      rating,
      comment,
    });

    const allReviews = await Review.find({ listing: listingId });
    const avgRating =
      allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length;

    listing.averageRating = avgRating;
    await listing.save();

    res.status(201).json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
