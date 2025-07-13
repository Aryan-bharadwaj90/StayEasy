// routes/properties.js
const express = require("express");
const router = express.Router();
const Listing = require("../Models/listing");

// GET /api/properties?location=Delhi
router.get("/", async (req, res) => {
  const location = req.query.location;
  if (!location) {
    return res.status(400).json({ error: "Location is required" });
  }

  try {
    const listings = await Listing.find({
      location: { $regex: new RegExp(location, "i") },
    });

    // Format to match expected structure on frontend
    const formatted = listings.map((listing) => ({
      _id: listing._id,
      name: listing.title,
      location: listing.location,
      price: listing.pricePerNight,
      image: listing.images[0] || "https://via.placeholder.com/200",
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
