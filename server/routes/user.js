import express from "express"
import User from "../models/User.js"
import authMiddleware from "../middleware/auth.js"
import { getStockDataForTickers } from "../services/stockService.js";
import { getYahooHistory } from "../services/stockService.js";
import Analysis from "../models/Analysis.js";

const router = express.Router();

router.get("/watchlist",authMiddleware,async(req,res)=>{
    const user=await User.findById(req.user.userId);
    
    if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
    res.json(user.watchlist)
})

router.post("/watchlist",authMiddleware,async(req,res)=>{
    const {ticker} = req.body;
    const user = await User.findById(req.user.userId);
    if (!user.watchlist.includes(ticker)) {
        user.watchlist.push(ticker);
        await user.save();
  }
    res.json(user.watchlist);
})

router.delete("/watchlist/:ticker",authMiddleware,async(req,res)=>{
    const {ticker} = req.params;
    const user = await User.findById(req.user.userId);
    user.watchlist= user.watchlist.filter(t=>t!==ticker);
    await user.save();
    res.json(user.watchlist)
})

router.get("/watchlist/details", authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.userId);

  if (!user) return res.status(404).json({ error: "User not found" });

  const tickers = user.watchlist;

  // 🔥 fetch stock data again
  const stockData = await getStockDataForTickers(tickers);

  const results = tickers.map(ticker => ({
    ticker,
    stock: stockData[ticker] || null,
  }));

  res.json(results);
});

router.get("/watchlist/insights", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const tickers = user.watchlist;

    const latestAnalysis = await Analysis.findOne().sort({ timestamp: -1 });

    const predictionTime= new Date(latestAnalysis.timestamp).getTime()

    const stockData = await getStockDataForTickers(tickers);

    const results = await Promise.all(
      tickers.map(async (ticker) => {
        const prediction = latestAnalysis?.results.find(
          (r) => r.ticker === ticker
        );

        const history = await getYahooHistory(ticker);

        return {
          ticker,
          prediction,
          history,
          stock: stockData[ticker] || null,
          predictionTime
        };
      })
    );
    console.log(results[1].history)
    res.json(results);
  } catch (err) {
    console.error("Watchlist insights error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;