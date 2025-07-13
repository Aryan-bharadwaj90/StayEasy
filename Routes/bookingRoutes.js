// // const express=require("express");
// // const stripe=require("stripe")(process.env.STRIPE_SECRET_KEY);
// // const booking=require("../Models/booking");
// // const listing=require("../Models/listing");

// // const {protect}=require("../middlewares/authenticate");

// // const router=express.Router();

// // router.get("/", protect, async (req, res) => {
// //   const bookings = await booking.find({
// //      guest: req.user.id 
// //     })
// //     .populate("listing", "title location")
// //     .sort({ createdAt: -1 });
// //   res.json(bookings);
// // });


// // router.post("/", protect, async (req, res) => {
// //   if (req.user.role !== "guest") return res.status(403).json({ message: "Only guests can book" });

// //   const { listingId, checkIn, checkOut, totalPrice } = req.body;

// //   const booklisting = await listing.findById(listingId);
// //   if (!booklisting) return res.status(404).json({ message: "Listing not found" });

// //   const newbooking = await booking.create({
// //     guest: req.user.id,
// //     host: listing.host,
// //     listing: listingId,
// //     checkIn,
// //     checkOut,
// //     totalPrice,
// //     paymentStatus: "pending" 
// //   });

// //   res.status(201).json(newbooking);
// // });

// // router.post("/:id/pay", protect, async (req, res) => {
// //   const newbooking = await booking.findById(req.params.id).populate("listing");
// //   if (!newbooking) return res.status(404).json({ message: "Booking not found" });

// //   if (req.user.id !== newbooking.guest.toString())
// //     return res.status(403).json({ message: "Unauthorized"});

// //   const paymentIntent = await stripe.paymentIntents.create({
// //     amount: Math.round(newbooking.totalPrice * 100), // in cents
// //     currency: "usd",
// //     metadata: { bookingId: booking._id.toString() }
// //   });

// //   newbooking.paymentStatus = "processing";
// //   await newbooking.save();

// //   res.send({ clientSecret: paymentIntent.client_secret });
// // });

// // // GET bookings for host's listings
// // router.get("/host", protect, async (req, res) => {
// //   if (req.user.role !== "host") return res.status(403).json({ message: "Only hosts can view" });

// //   const newbookings = await booking.find({ host: req.user.id })
// //     .populate("listing", "title location")
// //     .populate("guest", "name email")
// //     .sort({ createdAt: -1 });

// //   res.json(newbookings);
// // });

// // module.exports = router;

// const express = require("express");
// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// const booking = require("../Models/booking");
// const Listing = require("../Models/listing");
// const { protect } = require("../middlewares/authenticate");

// const router = express.Router();

// // ✅ Get bookings of guest
// router.get("/", protect, async (req, res) => {
//   const bookings = await booking.find({ guest: req.user.id })
//     .populate("listings", "title location")
//     .sort({ createdAt: -1 });
//   res.json(bookings);
// });

// // ✅ Create a booking
// router.post("/", protect, async (req, res) => {
//   if (req.user.role !== "guest") {
//     return res.status(403).json({ message: "Only guests can book" });
//   }

//   const { listingId, checkIn, checkOut, totalPrice } = req.body;

//   const booklisting = await Listing.findById(listingId);
//   if (!booklisting) {
//     return res.status(404).json({ message: "Listing not found" });
//   }

//   const newbooking = await booking.create({
//     guest: req.user.id,
//     host: booklisting.host,
//     listing: listingId,
//     checkIn,
//     checkOut,
//     totalPrice,
//     paymentStatus: "pending"
//   });

//   res.status(201).json(newbooking);
// });

// // ✅ Simulate payment (Stripe)
// router.post("/:id/pay", protect, async (req, res) => {
//   const newbooking = await booking.findById(req.params.id).populate("listing");
//   if (!newbooking) {
//     return res.status(404).json({ message: "Booking not found" });
//   }

//   if (req.user.id !== newbooking.guest.toString()) {
//     return res.status(403).json({ message: "Unauthorized" });
//   }

//   const paymentIntent = await stripe.paymentIntents.create({
//     amount: Math.round(newbooking.totalPrice * 100), // in cents
//     currency: "usd",
//     metadata: { bookingId: newbooking._id.toString() }
//   });

//   newbooking.paymentStatus = "processing";
//   await newbooking.save();

//   res.send({ clientSecret: paymentIntent.client_secret });
// });

// // ✅ Get bookings for host's listings
// router.get("/host", protect, async (req, res) => {
//   if (req.user.role !== "host") {
//     return res.status(403).json({ message: "Only hosts can view" });
//   }

//   const newbookings = await booking.find({ host: req.user.id })
//     .populate("listing", "title location")
//     .populate("guest", "name email")
//     .sort({ createdAt: -1 });

//   res.json(newbookings);
// });

// module.exports = router;

const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Booking = require("../Models/booking");
const Listing = require("../Models/listing");

const { protect } = require("../middlewares/authenticate");

const router = express.Router();

// 🔷 Get bookings for logged-in guest
router.get("/", protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ guest: req.user.id })
      .populate("listing", "title location") // ✅ correct path
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
});

// 🔷 Create a new booking
router.post("/", protect, async (req, res) => {
  try {
    if (req.user.role !== "guest") {
      return res.status(403).json({ message: "Only guests can book" });
    }

    const { listingId, checkIn, checkOut, totalPrice } = req.body;

    const booklisting = await Listing.findById(listingId);
    if (!booklisting) {
      return res.status(404).json({ message: "Listing not found" });
    }

    const newbooking = await Booking.create({
      guest: req.user.id,
      host: booklisting.host,
      listing: listingId,
      checkIn,
      checkOut,
      totalPrice,
      paymentStatus: "pending",
    });

    res.status(201).json(newbooking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create booking" });
  }
});

// 🔷 Pay for a booking
router.post("/:id/pay", protect, async (req, res) => {
  try {
    const newbooking = await Booking.findById(req.params.id).populate("listing");
    if (!newbooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (req.user.id !== newbooking.guest.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(newbooking.totalPrice * 100), // in cents
      currency: "usd",
      metadata: { bookingId: newbooking._id.toString() },
    });

    newbooking.paymentStatus = "paid";
    await newbooking.save();

    res.send({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to process payment" });
  }
});

// 🔷 Get bookings for host's listings
router.get("/host", protect, async (req, res) => {
  try {
    if (req.user.role !== "host") {
      return res.status(403).json({ message: "Only hosts can view" });
    }

    const newbookings = await Booking.find({ host: req.user.id })
      .populate("listing", "title location") // ✅ correct path
      .populate("guest", "name email")
      .sort({ createdAt: -1 });

    res.json(newbookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch host bookings" });
  }
});
// 🔷 Get booking by ID
router.get("/:id", protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("listing", "title location");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Only allow guest or host to access their own booking
    if (
      req.user.id !== booking.guest.toString() &&
      req.user.id !== booking.host.toString()
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch booking" });
  }
});
router.patch("/:id/mark-paid", protect, async (req, res) => {
  const newbooking = await Booking.findById(req.params.id);
  if (!newbooking) return res.status(404).json({ message: "Booking not found" });

  if (req.user.id !== newbooking.guest.toString()) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  newbooking.paymentStatus = "paid";
  await newbooking.save();

  res.json({ message: "Payment marked as paid", newbooking });
});
router.delete('/:id', protect, async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (booking.guest.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

  const now = new Date();
  if (now >= new Date(booking.checkIn)) {
    return res.status(400).json({ message: 'Cannot cancel after check-in' });
  }

  await booking.deleteOne();
  res.json({ message: 'Booking cancelled successfully' });
});

module.exports = router;

