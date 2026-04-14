import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
    },
    password:{
        type:String,
        required:true,
    },
    watchlist:[
        {
            ticker: {type:String,required:true},
            predictionTime: {type:Number, required:true}
        }
    ],
},{timestamps:true});

export default mongoose.model("User",userSchema)