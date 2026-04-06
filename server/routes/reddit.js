import express from "express";
import { fetchLatestPosts } from "../services/redditService.js";

const router = express.Router();

// GET /api/reddit/latest
router.get("/latest", async (req, res) => {
  try {
    console.log("Fetching latest Reddit posts...");
    const posts = await fetchLatestPosts();

    res.json({
      success: true,
      count: posts.length,
      posts,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;