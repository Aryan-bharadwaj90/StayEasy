const mongoose=require("mongoose");

const listingSchema=new mongoose.Schema({
    host:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
    },
    title:String,
    description:String,
    location:String,
    pricePerNight:Number,
    images:[String],
    lat: Number,
    lng: Number,
    averageRating: {
    type: Number,
    default: 0,
    },
    createdAt:{
        type:Date,
        default:Date.now,
    }
},{timestamps:true});

module.exports=mongoose.model("Listing",listingSchema);