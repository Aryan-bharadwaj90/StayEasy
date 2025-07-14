require("dotenv").config();
const express = require("express");
const { upload, uploadToFirebase,bucket} = require("../firebaseUpload");
const listing = require("../Models/listing");
const Booking = require("../Models/booking"); 
const { geocode } = require("../utility/geocode");
const { protect } = require("../middlewares/authenticate");
const multer = require("multer");

const router = express.Router();


router.get("/", async (req, res) => {
  try {
    const query = {};

    if (req.query.minPrice) query.pricePerNight = { $gte: req.query.minPrice };
    if (req.query.maxPrice) {
      query.pricePerNight = {
        ...(query.pricePerNight || {}),
        $lte: req.query.maxPrice
      };
    }

    if (req.query.minRating) query.averageRating = { $gte: req.query.minRating };


    if (req.query.startDate && req.query.endDate) {
      const bookedListings = await Booking.find({
        $or: [
          { checkIn: { $lte: req.query.endDate, $gte: req.query.startDate } },
          { checkOut: { $gte: req.query.startDate, $lte: req.query.endDate } }
        ]
      }).distinct("listing");

      query._id = { $nin: bookedListings };
    }

    const listings = await listing.find(query).populate("host", "name email");
    res.json(listings);
  } catch (err) {
    console.error("Error fetching listings:", err);
    res.status(500).json({ error: "Failed to fetch listings" });
  }
});


router.get("/search", async (req, res) => {
  try {
    const { minPrice, maxPrice, minRating } = req.query;
    const query = {};

    if (minPrice) query.pricePerNight = { ...query.pricePerNight, $gte: Number(minPrice) };
    if (maxPrice) query.pricePerNight = { ...query.pricePerNight, $lte: Number(maxPrice) };
    if (minRating) query.averageRating = { $gte: Number(minRating) };

    const listings = await listing.find(query).populate("host", "name email");
    res.json(listings);
  } catch (err) {
    console.error("Error searching listings:", err);
    res.status(500).json({ error: "Error searching listings" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const found = await listing.findById(req.params.id).populate("host", "name email");
    if (!found) return res.status(404).json({ message: "Listing not found" });
    res.json(found);
  } catch (err) {
    console.error("Error fetching listing:", err);
    res.status(500).json({ error: "Server error" });
  }
});


router.post("/create", protect, upload.array("images", 5), async (req, res) => {
  try {
    if (req.user.role !== "host") {
      return res.status(403).json({ message: "Only Host can create listings" });
    }

    const { title, description, location, pricePerNight } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No images uploaded" });
    }

    const geo = await geocode(location);
    if (!geo) {
      return res.status(400).json({ message: "Could not geocode the location" });
    }

    const imageUploadPromises = req.files.map((file) => uploadToFirebase(file));
    const imageUrls = await Promise.all(imageUploadPromises);

    const newListing = await listing.create({
      host: req.user.id,
      title,
      description,
      location,
      pricePerNight,
      lat: geo.lat,
      lng: geo.lng,
      images: imageUrls
    });

    res.status(201).json(newListing);
  } catch (err) {
    console.error("Error creating listing:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});


router.put("/:id", protect, upload.array("images", 5), async (req, res) => {
  try {
    const found = await listing.findById(req.params.id);
    if (!found) return res.status(404).json({ message: "Listing not found" });
    if (found.host.toString() !== req.user.id)
      return res.status(403).json({ message: "Unauthorized" });

    const {
      title,
      description,
      location,
      pricePerNight,
      existingImages, // stringified JSON
    } = req.body;

    // Parse existing images array
    let updatedImages = [];
    if (existingImages) {
      try {
        updatedImages = JSON.parse(existingImages);
        if (!Array.isArray(updatedImages)) throw new Error("Invalid images array");
      } catch (err) {
        return res.status(400).json({ message: "Invalid existingImages format" });
      }
    }

    // Upload new images if provided
    if (req.files && req.files.length > 0) {
      const uploads = await Promise.all(req.files.map(uploadToFirebase));
      updatedImages = [...updatedImages, ...uploads];
    }

    const geo = await geocode(location);
    if (!geo) {
      return res.status(400).json({ message: "Could not geocode the location" });
    }

    found.title = title;
    found.description = description;
    found.location = location;
    found.pricePerNight = pricePerNight;
    found.lat = geo.lat;
    found.lng = geo.lng;
    found.images = updatedImages;

    await found.save();

    res.json({ message: "Listing updated successfully", listing: found });
  } catch (err) {
    console.error("Error updating listing:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});


//const { bucket } = require("../firebaseUpload"); 


const extractFileNameFromUrl = (url) => {
  const matches = decodeURIComponent(url).match(/\/o\/(.+)\?alt=media/);
  return matches ? matches[1] : null;
};

router.delete("/:id", protect, async (req, res) => {
  try {
    const found = await listing.findById(req.params.id);
    if (!found) return res.status(404).json({ message: "Listing not found" });

    if (found.host.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    
    if (found.images && Array.isArray(found.images)) {
      for (const imageUrl of found.images) {
        const filename = extractFileNameFromUrl(imageUrl);
        if (filename) {
          try {
            await bucket.file(filename).delete();
            console.log(`Deleted file from Firebase: ${filename}`);
          } catch (err) {
            console.warn(`Failed to delete ${filename}:`, err.message);
          }
        }
      }
    }

    await found.deleteOne(); 
    res.json({ message: "Listing and images removed successfully" });
  } catch (err) {
    console.error("Error deleting listing:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});



router.get("/host/:hostId", async (req, res) => {
  try {
    const listings = await listing.find({ host: req.params.hostId });
    res.json(listings);
  } catch (err) {
    console.error("Error fetching host listings:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
