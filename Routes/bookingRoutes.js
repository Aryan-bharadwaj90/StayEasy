const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Booking = require("../Models/booking");
const Listing = require("../Models/listing");

const { protect } = require("../middlewares/authenticate");

const router = express.Router();


router.get("/", protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ guest: req.user.id })
      .populate("listing", "title location")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
});


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
      amount: Math.round(newbooking.totalPrice * 100),
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


router.get("/host", protect, async (req, res) => {
  try {
    if (req.user.role !== "host") {
      return res.status(403).json({ message: "Only hosts can view" });
    }

    const newbookings = await Booking.find({ host: req.user.id })
      .populate("listing", "title location") 
      .populate("guest", "name email")
      .sort({ createdAt: -1 });

    res.json(newbookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch host bookings" });
  }
});

router.get("/:id", protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("listing", "title location");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    
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

