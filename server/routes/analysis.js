
import express from "express";
import cron from "node-cron";
import { calculatePredictionScore, enrichWithPredictions } from "../services/predictionService.js";
import { fetchLatestPosts } from "../services/redditService.js";
import { analyzeAllPosts } from "../services/sentimentService.js";
import { getStockDataForTickers } from "../services/stockService.js";
import Analysis from "../models/Analysis.js";
import authMiddleware from "../middleware/auth.js";


const router = express.Router();

let latestAnalysis = null;
let lastUpdated = null;
let isRunning = true;

async function runFullPipeline() {
  console.log("\n═══════════════════════════════");
  console.log("✦ Starting full analysis pipeline");
  console.log("═══════════════════════════════\n");

  // Step 1 — Scrape Reddit
  console.log("Step 1: Scraping Reddit...");
  const posts = await fetchLatestPosts(50);
  console.log(`✦ Scraped ${posts.length} posts\n`);

  // Step 2 — Analyze sentiment
  console.log("Step 2: Analyzing sentiment with Groq...");
  const sentimentResults = await analyzeAllPosts(posts);
  console.log(`✦ Found ${sentimentResults.length} tickers mentioned\n`);

  // Step 3 — Get stock prices
  console.log("Step 3: Fetching stock prices...");
  const tickers = sentimentResults.map(r => r.ticker);
  const stockData = await getStockDataForTickers(tickers);
  console.log(`✦ Got price data for ${Object.keys(stockData).length} tickers\n`);

  // Step 4 — Merge sentiment + stock data
  const enrichedResults = sentimentResults.map(result => ({
  ...result,
  stock: stockData[result.ticker] || null,
}));

const finalResults = enrichWithPredictions(enrichedResults);

// const finalResults = enrichedResults.map(result => {
//   const prediction = calculatePredictionScore(result, enrichedResults);
//   console.log(prediction)
//   return {
//     ...result,
//     prediction,
//   };
// });

const response = {
  success: true,
  analyzedPosts: posts.length,
  tickersFound: finalResults.length,
  results: finalResults,
  timestamp: new Date().toISOString(),
};

// ✅ SAVE THIS (correct data)
await Analysis.create({
  analyzedPosts: response.analyzedPosts,
  tickersFound: response.tickersFound,
  results: response.results,
  timestamp: new Date(),
});

return response;
}

router.get("/history/:ticker", async (req, res) => {
  const { ticker } = req.params;

  const history = await Analysis.find({
    "results.ticker": ticker,
  }).sort({ timestamp: 1 });

  const formatted = history.map(entry => {
    const match = entry.results.find(r => r.ticker === ticker);

    return {
      timestamp: entry.timestamp,
      predictionScore: match?.prediction?.predictionScore,
      signal: match?.prediction?.signal,
      price: match?.stock?.price,
    };
  });

  res.json(formatted);
});

router.get("/run", authMiddleware, async (req, res) => {
  try {
    const result = await runFullPipeline();

    // Cache it
    latestAnalysis = result;
    lastUpdated = new Date();

    res.json(result);
  } catch (err) {
    console.error("Analysis pipeline error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/latest", authMiddleware, async (req, res) => {
  try {
    const latest = await Analysis.findOne().sort({ timestamp: -1 });

    if (!latest) {
      return res.status(404).json({
        error: "No analysis available yet",
      });
    }

    res.json({
      success: true,
      analyzedPosts: latest.analyzedPosts,
      tickersFound: latest.tickersFound,
      results: latest.results,
      timestamp: latest.timestamp,
      cached: true,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

cron.schedule("0 */6 * * *", async () => {
  console.log("Cron triggered: Running analysis...");

  if (isRunning) {
    console.log("Previous job still running. Skipping...");
    return;
  }

  isRunning = true;

  try {
    const result = await runFullPipeline();
    latestAnalysis = result;
    lastUpdated = new Date();

    console.log("Cron analysis updated");
  } catch (err) {
    console.error(" Cron failed:", err);
  } finally {
    isRunning = false;
  }
});

// (async () => {
//   console.log(" Initial analysis on startup...");

//   try {
//     const result = await runFullPipeline();
//     latestAnalysis = result;
//     lastUpdated = new Date();

//     console.log("Initial analysis ready");
//   } catch (err) {
//     console.error("Initial run failed:", err);
//   }
// })();

export default router;
