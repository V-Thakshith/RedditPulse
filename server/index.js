import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import redditRoutes from "./routes/reddit.js";
import analysisRoutes from "./routes/analysis.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js"


dotenv.config();

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/reddit", redditRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/user",userRoutes)

app.get("/", (req, res) => {
  res.json({ status: "Reddit Sentiment API running ✦" });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log(" MongoDB connected"))
  .catch(err => console.error(" MongoDB error:", err));

app.listen(process.env.PORT, () => {
  console.log(`✦ Server running on http://localhost:${process.env.PORT}`);
});