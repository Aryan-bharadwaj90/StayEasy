const mongoose=require("mongoose");


const wishlistSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },
}, { timestamps: true });

module.exports = mongoose.model('Wishlist', wishlistSchema);
