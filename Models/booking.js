const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  guest: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  host: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  listing: { type: mongoose.Schema.Types.ObjectId, ref: "Listing" }, 
  checkIn: Date,
  checkOut: Date,
  totalPrice: Number,
  paymentStatus: { type: String, default: "pending" },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);
