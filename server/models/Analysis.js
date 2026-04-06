import mongoose from "mongoose";

const analysisSchema= new mongoose.Schema({
    timestamp:{type:Date,default:Date.now},
    analyzedPosts: Number,
    tickersFound: Number,

    results:[{
        ticker:String,
        mentions:Number,

        sentiments: {
            positive: Number,
            negative: Number,
            neutral: Number
        },

        predictions:{
            predictionScore: Number,
            signal: String,
            confidence: String,
            breakdown: mongoose.Schema.Types.Mixed,
        },

        stocks: mongoose.Schema.Types.Mixed,
        topPosts: [mongoose.Schema.Types.Mixed],
    }]
});

export default mongoose.model("Analysis", analysisSchema)