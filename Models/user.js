const mongoose=require("mongoose");

const userSchema=new mongoose.Schema({
    name:String,
    email:{
        type:String,
        unique:true,
    },
    password:String,
    role:{
        type:String,
        enum:["guest","host","admin"],
        default:"guest",
    },
    createdAt:
    {
        type:Date,
        default:Date.now
    }
},{timestamps:true});

module.exports=mongoose.model("User",userSchema);