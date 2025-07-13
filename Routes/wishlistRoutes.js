const express = require("express");
const router = express.Router();
const Review = require("../Models/review");
const Wishlist = require("../Models/Wishlist");
const { protect } = require("../middlewares/authenticate");


router.post('/:listingId', protect, async (req, res) => {
  const exists = await Wishlist.findOne({ user: req.user.id, listing: req.params.listingId });
  if (exists) {
    await exists.deleteOne();
    return res.json({ message: 'Removed from wishlist' });
  }
  await Wishlist.create({ user: req.user.id, listing: req.params.listingId });
  res.json({ message: 'Added to wishlist' });
});

router.get('/', protect, async (req, res) => {
  const items = await Wishlist.find({ user: req.user.id }).populate('listing');
  res.json(items);
});

module.exports=router;