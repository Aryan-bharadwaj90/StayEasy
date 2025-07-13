// require("dotenv").config();
// const express=require("express");

// const { upload, uploadToFirebase } = require("../firebaseUpload");

// const listing=require("../Models/listing");
// const {geocode} = require("../utility/geocode");
// const {protect}=require("../middlewares/authenticate");

// const router=express.Router();

// router.get("/",async(req,res)=>
// {
//     const listings=await listing.find().populate("host","name email");
//     res.json(listings);
// });
// router.get("/search", async (req, res) => {
//   const { minPrice, maxPrice, minRating, checkIn, checkOut } = req.query;

//   const query = {};

//   if (minPrice) query.pricePerNight = { ...query.pricePerNight, $gte: Number(minPrice) };
//   if (maxPrice) query.pricePerNight = { ...query.pricePerNight, $lte: Number(maxPrice) };
//   if (minRating) query.averageRating = { $gte: Number(minRating) };

 

//   try {
//     const listings = await listing.find(query);
//     res.json(listings);
//   } catch (err) {
//     console.error("Error fetching filtered listings:", err);
//     res.status(500).json({ error: "Server error while filtering listings" });
//   }
// });

// router.get("/:id",async(req,res)=>
// {
//     const foundlisting=await listing.findById(req.params.id).populate("host","name email");
//     if(!foundlisting) return res.status(400).json({message:"Listing not found"});
//     res.json(foundlisting);
// });


// router.post("/create", protect, upload.array("images", 5), async (req, res) => {
//   try {
//     if (req.user.role !== "host")
//       return res.status(403).json({ message: "Only Host can create listings" });

//     const { title, description, location, pricePerNight } = req.body;

//     if (!req.files || req.files.length === 0) {
//       return res.status(400).json({ message: "No images uploaded" });
//     }
//     const geo = await geocode(location); 
//       if (!geo) {
//         return res.status(400).json({ message: "Could not geocode the location" });
//       }

//       const { lat, lng } = geo;
    
//     const imageUploadPromises = req.files.map((file) => uploadToFirebase(file));
//     const imageUrls = await Promise.all(imageUploadPromises);

//     const newlisting = await listing.create({
//       host: req.user.id,
//       title,
//       description,
//       location,
//       pricePerNight,
//       lat,
//       lng,
//       images: imageUrls,
//     });

//     res.status(201).json(newlisting);
//     console.log(newlisting);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// });


// router.put("/:id",protect,async(req,res)=>
// {
//     const foundlisting=await listing.findById(req.params.id);
//     if (!foundlisting) return res.status(404).json({ message: "Listing not found" });
//   if (foundlisting.host.toString() !== req.user.id) return res.status(403).json({ message: "Unauthorized" });

//   const updated = await listing.findByIdAndUpdate(req.params.id, req.body, { new: true });
//   res.json(updated);
// });

// router.delete("/:id",protect,async(req,res)=>{
//     const foundlisting=await listing.findById(req.params.id);
//     if (!foundlisting) return res.status(404).json({ message: "Listing not found" });
//   if (foundlisting.host.toString() !== req.user.id) return res.status(403).json({ message: "Unauthorized" });
  
//   await foundlisting.remove();
//   res.json({message:"Listing Removed"});

// });

// router.get("/host/:hostId", async (req, res) => {
//     try {
//         const listings = await listing.find({ host: req.params.hostId });
//         res.json(listings);
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ message: "Server error" });
//     }
// });
// router.get('/', async (req, res) => {
//   const query = {};
//   if (req.query.minPrice) query.pricePerNight = { $gte: req.query.minPrice };
//   if (req.query.maxPrice) query.pricePerNight = { ...(query.pricePerNight || {}), $lte: req.query.maxPrice };
//   if (req.query.minRating) query.averageRating = { $gte: req.query.minRating };
//   if (req.query.startDate && req.query.endDate) {
//     const bookedListings = await Booking.find({
//       $or: [
//         { checkIn: { $lte: req.query.endDate, $gte: req.query.startDate } },
//         { checkOut: { $gte: req.query.startDate, $lte: req.query.endDate } }
//       ]
//     }).distinct('listing');
//     query._id = { $nin: bookedListings };
//   }
//   const listings = await Listing.find(query);
//   res.json(listings);
// });



// module.exports=router;
require("dotenv").config();
const express = require("express");
const { upload, uploadToFirebase } = require("../firebaseUpload");
const listing = require("../Models/listing");
const Booking = require("../Models/Booking"); 
const { geocode } = require("../utility/geocode");
const { protect } = require("../middlewares/authenticate");

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


router.put("/:id", protect, async (req, res) => {
  try {
    const found = await listing.findById(req.params.id);
    if (!found) return res.status(404).json({ message: "Listing not found" });
    if (found.host.toString() !== req.user.id) return res.status(403).json({ message: "Unauthorized" });

    const updated = await listing.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    console.error("Error updating listing:", err);
    res.status(500).json({ error: "Server error" });
  }
});


router.delete("/:id", protect, async (req, res) => {
  try {
    const found = await listing.findById(req.params.id);
    if (!found) return res.status(404).json({ message: "Listing not found" });
    if (found.host.toString() !== req.user.id) return res.status(403).json({ message: "Unauthorized" });

    await found.remove();
    res.json({ message: "Listing removed" });
  } catch (err) {
    console.error("Error deleting listing:", err);
    res.status(500).json({ error: "Server error" });
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
