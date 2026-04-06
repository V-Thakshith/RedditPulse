# RedditPulse — Reddit Sentiment Stock Prediction

> A full-stack application that scrapes Reddit in real time, analyzes post sentiment using AI, fetches live stock prices, and generates buy/sell/hold predictions using a multi-signal weighted algorithm.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [System Architecture](#3-system-architecture)
4. [How It Works — Full Pipeline](#4-how-it-works--full-pipeline)
5. [Module 1 — Reddit Scraper](#5-module-1--reddit-scraper)
6. [Module 2 — Sentiment Analysis](#6-module-2--sentiment-analysis)
7. [Module 3 — Stock Price Data](#7-module-3--stock-price-data)
8. [Module 4 — Prediction Score Algorithm](#8-module-4--prediction-score-algorithm)
9. [API Reference](#9-api-reference)
10. [Project Structure](#10-project-structure)
11. [Setup & Installation](#11-setup--installation)
12. [Key Design Decisions](#12-key-design-decisions)
13. [Limitations & Future Improvements](#13-limitations--future-improvements)

---

## 1. Project Overview

RedditPulse monitors Reddit's finance communities in real time, extracts which stocks are being discussed, analyzes the sentiment of each discussion using a Large Language Model (LLM), and combines multiple signals to generate a prediction score for each stock.

**The core insight:** Reddit communities like r/wallstreetbets have demonstrated real market-moving power (e.g. the GameStop short squeeze of 2021). By systematically reading and quantifying what retail investors are saying, we can identify stocks with unusual sentiment activity before price moves occur.

**What makes this different from simple sentiment tools:**
- Uses an LLM (Llama 3.3) to understand financial slang, sarcasm, and emojis — not just keyword matching
- Weights sentiment by post popularity (upvotes) — viral posts carry more signal than obscure ones
- Combines 4 independent signals into a single prediction score
- Works on any trending stock automatically — no need to specify a ticker

---

## 2. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Backend | Node.js + Express | HTTP server and API routing |
| Web Scraping | Puppeteer (headless Chrome) | Scrape Reddit without API credentials |
| AI / LLM | Groq API + Llama 3.3 70B | Sentiment analysis and ticker extraction |
| Stock Data | Yahoo Finance API (direct HTTP) | Real-time stock prices |
| Frontend | React + Vite | Dashboard UI |
| Charts | Recharts | Data visualization |
| Config | dotenv | Environment variable management |

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Frontend                           │
│              (Dashboard, Cards, Filters, Charts)                │
└───────────────────────────┬─────────────────────────────────────┘
                            │ GET /api/analysis/run
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Express Backend                            │
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   Reddit    │  │  Sentiment   │  │   Prediction Score   │   │
│  │  Scraper    │→ │   Service    │→ │      Service         │   │
│  │ (Puppeteer) │  │   (Groq)     │  │   (Algorithm)        │   │
│  └─────────────┘  └──────────────┘  └──────────────────────┘   │
│                                              │                  │
│                          ┌───────────────────┘                  │
│                          ▼                                      │
│                  ┌──────────────┐                               │
│                  │ Stock Price  │                               │
│                  │   Service    │                               │
│                  │ (Yahoo API)  │                               │
│                  └──────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. How It Works — Full Pipeline

When `GET /api/analysis/run` is called, the following sequence executes:

```
Step 1 — Reddit Scraping
Puppeteer opens a headless Chrome browser
→ Navigates to old.reddit.com/r/wallstreetbets/hot
→ Navigates to old.reddit.com/r/wallstreetbets/new
→ Navigates to old.reddit.com/r/stocks/hot
→ Navigates to old.reddit.com/r/investing/hot
→ Extracts: title, body, score (upvotes), numComments, url, createdAt
→ Removes duplicates, sorts by score
→ Returns top 100 posts

Step 2 — Sentiment Analysis (per post)
For each post → send title + body to Groq (Llama 3.3)
→ LLM extracts mentioned stock tickers
→ LLM scores sentiment per ticker: -1.0 to +1.0
→ Results grouped by ticker

Step 3 — Stock Price Fetching
For each discovered ticker → call Yahoo Finance API
→ Returns: price, change%, volume, day high/low

Step 4 — Prediction Score Calculation
For each ticker → combine 4 signals with weighted formula
→ Output: score 0-100, signal (STRONG BUY to STRONG SELL), confidence

Step 5 — Response
Merged result returned to React frontend
→ Dashboard renders ticker cards with all data
```

---

## 5. Module 1 — Reddit Scraper

**File:** `server/services/redditService.js`

### Why Puppeteer Instead of the Reddit API?

Reddit's official API (PRAW/snoowrap) requires account verification, approval, and has been increasingly restricted since the 2023 API controversy. Puppeteer scrapes Reddit's website directly using a real browser — no credentials needed.

### Why old.reddit.com Instead of reddit.com?

Reddit's new UI (`reddit.com`) is a React Single Page Application — its content is rendered dynamically by JavaScript after the page loads, making it complex to scrape reliably.

`old.reddit.com` uses classic server-rendered HTML with predictable, stable CSS class names:
- Every post is wrapped in `div.thing`
- Title is `a.title`
- Score is `div.score.unvoted`
- Comments count is `a.comments`

This structure rarely changes and is far easier to parse.

### How Puppeteer Works

```javascript
// 1. Launch headless Chrome (no visible window)
const browser = await puppeteer.launch({ headless: "new" });
const page = await browser.newPage();

// 2. Pretend to be a real browser (avoid bot detection)
await page.setUserAgent("Mozilla/5.0 ... Chrome/120 ...");

// 3. Navigate to the target URL
await page.goto("https://old.reddit.com/r/wallstreetbets/hot/");

// 4. Wait for posts to appear in the DOM
await page.waitForSelector("div.thing");

// 5. Run JavaScript INSIDE the browser to extract data
const posts = await page.evaluate(() => {
  return document.querySelectorAll("div.thing").map(el => ({
    title: el.querySelector("a.title")?.innerText,
    score: parseInt(el.querySelector("div.score")?.innerText)
  }));
});

// 6. Close browser
await browser.close();
```

**Key concept — `page.evaluate()`:** This function runs code inside the Chrome browser instance, not in Node.js. It has access to the full DOM (`document`, `querySelector` etc.) exactly like browser DevTools. The results are serialized back to Node.js.

### Rate Limiting

A 2-second delay is added between each subreddit request to avoid Reddit temporarily blocking the IP for too many rapid requests:

```javascript
await new Promise(r => setTimeout(r, 2000));
```

### Data Extracted Per Post

| Field | Source | Used For |
|---|---|---|
| `title` | `a.title` innerText | Sent to LLM for sentiment |
| `body` | `.expando .md p` | Sent to LLM for context |
| `score` | `div.score` innerText | Weighting in prediction |
| `numComments` | `a.comments` innerText | Weighting in prediction |
| `url` | `a.title` href | Linked in dashboard |
| `createdAt` | `time[datetime]` attribute | Timestamp display |

---

## 6. Module 2 — Sentiment Analysis

**File:** `server/services/sentimentService.js`

### Why Use an LLM Instead of VADER or TextBlob?

Traditional sentiment tools use dictionaries of positive/negative words. They fail on Reddit finance posts because:

| Text | VADER | Llama 3.3 |
|---|---|---|
| "TSLA to the moon 🚀" | Neutral (doesn't know 🚀 = bullish) | Positive (0.92) |
| "This stock is absolutely COOKED 💀" | Negative ✅ but wrong reason | Negative (WSB slang for failed) |
| "Not NOT going up" | Confused by double negative | Positive (understands logic) |
| "Loaded up on calls" | Neutral (doesn't know "calls" = bullish bet) | Positive (0.85) |
| "10k puts incoming" | Neutral | Negative (0.90) |

Llama 3.3 70B was trained on internet text including Reddit finance communities. It understands options terminology, rocket emojis, WSB slang, and sarcasm in context.

### What Gets Sent to Groq

To stay within token limits and control cost, only the essential text is sent:

```javascript
const text = `${post.title}. ${post.body}`.slice(0, 600);
```

- Title + first 600 characters of body
- Subreddit name (context clue — WSB = more speculative)
- Upvotes and comments are NOT sent — these are used in Node.js for weighting

### The Prompt

```
You are a financial sentiment analyzer for Reddit posts.

Analyze this Reddit post from r/wallstreetbets:
"[post text here]"

Extract any stock tickers mentioned or clearly implied.
For each ticker, determine the sentiment toward that stock.

Rules:
- Only include real publicly traded stock tickers
- Sentiment score between -1.0 (very negative) and +1.0 (very positive)
- Consider: "to the moon" = positive, "puts" = negative, "calls" = positive,
  "YOLO" = high risk bullish, "cooked" = very negative

Return ONLY JSON, no explanation.
```

**Key prompt engineering techniques used:**

1. **Role assignment** — "You are a financial sentiment analyzer" primes the model for the task
2. **Explicit rules** — Defining Reddit slang prevents misinterpretation
3. **JSON-only output** — "Return ONLY JSON" makes the response parseable
4. **`temperature: 0.1`** — Low temperature makes responses more consistent and deterministic

### Response Parsing

Groq sometimes wraps JSON in markdown code blocks (` ```json ... ``` `). This is stripped before parsing:

```javascript
const cleaned = content.replace(/```json|```/g, "").trim();
const parsed = JSON.parse(cleaned);
```

### Aggregation by Ticker

After all posts are analyzed, results are grouped by ticker:

```javascript
// For each ticker mention across all posts:
tickerMap[ticker].mentions++
tickerMap[ticker].weightedScoreSum += sentimentScore * postWeight
tickerMap[ticker].totalWeight += postWeight

// Post weight = upvotes + (comments × 0.5)
// Comments worth half because they can be controversial (lots of disagreement)
const weight = post.score + (post.numComments * 0.5);
```

**Why weight by upvotes?**

A post with 50,000 upvotes represents tens of thousands of people agreeing with the sentiment. A post with 3 upvotes might be one person's opinion that nobody else endorsed. The upvote weighting ensures community consensus is reflected in the final score.

**Why comments worth half of upvotes?**

High comment count can mean:
- Strong agreement (people commenting "this!", "same", "LFG") → bullish signal
- OR strong controversy (people arguing) → unclear signal

Since comments don't tell us the direction of engagement, they're given half the weight of upvotes which are directionally clear (an upvote = agreement).

### Final Score Calculation Per Ticker

```javascript
finalScore = weightedScoreSum / totalWeight
// Range: -1.0 to +1.0
```

---

## 7. Module 3 — Stock Price Data

**File:** `server/services/stockService.js`

### Why Direct HTTP Instead of a Package?

The `yahoo-finance2` npm package had breaking changes in its latest version that required instantiation patterns incompatible with our ES module setup. Instead of fighting the package, we call Yahoo Finance's unofficial API endpoint directly using Node's built-in `fetch`:

```
https://query1.finance.yahoo.com/v8/finance/chart/TSLA?interval=1d&range=1d
```

This is the same endpoint the package uses internally — we eliminated the middleman.

### Data Returned Per Ticker

```javascript
{
  ticker: "TSLA",
  name: "Tesla, Inc.",
  price: 245.50,           // current market price
  change: -3.20,           // absolute change from previous close
  changePercent: -1.29,    // percentage change
  volume: 85000000,        // shares traded today
  high: 249.80,            // day high
  low: 243.10,             // day low
  previousClose: 248.70,   // yesterday's closing price
  currency: "USD"
}
```

### Price Context for Predictions

Stock price movement is used as one of the 4 prediction signals. The key insight:

- **Sentiment says BUY + price already rising** → Strong confirmation → Higher prediction score
- **Sentiment says BUY + price falling** → Contrarian or premature signal → Lower prediction score
- **Sentiment says SELL + price crashing** → Strong confirmation → Lower prediction score

---

## 8. Module 4 — Prediction Score Algorithm

**File:** `server/services/predictionService.js`

This is the core algorithm. It combines 4 independent signals into a single prediction score from 0 to 100.

### The 4 Signals

#### Signal 1 — Sentiment Score (Weight: 40%)

The weighted average sentiment from the LLM analysis.

```
Range: -1.0 to +1.0
-1.0 = extremely bearish
 0.0 = neutral
+1.0 = extremely bullish

Source: Groq/Llama analysis of Reddit posts
Weight in final score: 40%
```

This is the primary signal — it directly captures what Reddit thinks about the stock.

#### Signal 2 — Mention Velocity (Weight: 25%)

How much this stock is being talked about relative to other stocks in the same analysis batch.

```javascript
// Normalize mentions relative to all tickers found
velocity = (mentions - minMentions) / (maxMentions - minMentions)
// Range: 0.0 to 1.0

// Apply direction from sentiment
velocityWithDirection = velocity × (finalScore >= 0 ? +1 : -1)
```

**Why this matters:** A stock mentioned 10 times in one scan while others average 1-2 mentions is experiencing an unusual spike in attention. That spike amplifies the sentiment signal — high buzz + positive sentiment is a stronger buy signal than low buzz + positive sentiment.

**Direction is applied from sentiment** — if sentiment is negative, high mention velocity makes it a stronger SELL signal (lots of people talking negatively is worse than one person talking negatively).

#### Signal 3 — Price Momentum (Weight: 20%)

Is the stock already moving in the direction Reddit predicts?

```javascript
// Cap at ±15% to prevent outliers from dominating
// (e.g. PL was +30% which would skew everything)
const capped = Math.max(-15, Math.min(15, changePercent));
momentum = capped / 15;
// Range: -1.0 to +1.0
```

**Why cap at ±15%?** Occasionally a stock has a massive single-day move (+30%, -40%) due to earnings or news. Without capping, this outlier would dominate the signal. Capping normalizes it — a +20% day and a +15% day both get the same maximum momentum score.

**What this signal captures:**
- Sentiment BUY + price already rising = momentum confirms sentiment = stronger BUY
- Sentiment BUY + price falling = smart money disagreeing with Reddit = weaker BUY
- Sentiment SELL + price crashing = momentum confirms sentiment = stronger SELL

#### Signal 4 — Conviction Score (Weight: 15%)

How unanimous is Reddit's opinion? Are all posts pointing the same direction, or is there disagreement?

```javascript
const total = positive + negative + neutral;
const dominant = Math.max(positive, negative);

// What % of posts agree on the dominant sentiment
conviction = dominant / total;
// Range: 0.0 to 1.0 (1.0 = all posts same direction)

// Apply direction
convictionWithDirection = conviction × (finalScore >= 0 ? +1 : -1)
```

**Example:**
- 4 negative posts, 0 positive → conviction = 1.0 → high conviction SELL
- 2 negative, 2 positive → conviction = 0.5 → mixed signals, lower weight
- 3 positive, 1 negative → conviction = 0.75 → moderate conviction BUY

### Combining the Signals

```javascript
combinedScore =
  (sentimentSignal    × 0.40) +   // 40% weight
  (velocitySignal     × 0.25) +   // 25% weight
  (momentumSignal     × 0.20) +   // 20% weight
  (convictionSignal   × 0.15)     // 15% weight

// combinedScore range: -1.0 to +1.0
```

### Converting to Display Score (0-100)

```javascript
displayScore = ((combinedScore + 1) / 2) × 100

// -1.0 → 0   (extremely bearish)
//  0.0 → 50  (neutral)
// +1.0 → 100 (extremely bullish)
```

### Signal Thresholds

| Combined Score | Display Score | Signal | Confidence |
|---|---|---|---|
| > 0.5 | > 75 | STRONG BUY | High |
| 0.2 to 0.5 | 60–75 | BUY | Medium |
| -0.2 to 0.2 | 40–60 | HOLD | Low |
| -0.5 to -0.2 | 25–40 | SELL | Medium |
| < -0.5 | < 25 | STRONG SELL | High |

### Real Example — SMCI

```
SMCI on 2026-03-20 (Super Micro execs charged with smuggling chips)

Signal 1 — Sentiment:   -0.658  × 0.40 = -0.263
Signal 2 — Velocity:    -1.0    × 0.25 = -0.250  (most mentioned, direction negative)
Signal 3 — Momentum:    -1.0    × 0.20 = -0.200  (stock down 27%, capped at -15%)
Signal 4 — Conviction:  -0.75   × 0.15 = -0.112  (3 of 4 posts negative)

Combined Score: -0.263 + (-0.250) + (-0.200) + (-0.112) = -0.825
Display Score:  ((−0.825 + 1) / 2) × 100 = 9/100
Signal:         STRONG SELL
Confidence:     High

Actual price that day: -27.33% ✅
```

### Real Example — PL (Planet Labs)

```
PL on 2026-03-20 (earnings beat, stock surged)

Signal 1 — Sentiment:   +0.80  × 0.40 = +0.320
Signal 2 — Velocity:    +0.35  × 0.25 = +0.087  (moderate mentions)
Signal 3 — Momentum:    +1.0   × 0.20 = +0.200  (stock up 30%, capped at +15%)
Signal 4 — Conviction:  +1.0   × 0.15 = +0.150  (all posts positive)

Combined Score: 0.320 + 0.087 + 0.200 + 0.150 = 0.757
Display Score:  ((0.757 + 1) / 2) × 100 = 88/100
Signal:         STRONG BUY
Confidence:     High

Actual price that day: +29.97% ✅
```

---

## 9. API Reference

### `GET /api/analysis/run`

Runs the full pipeline: scrape Reddit → analyze sentiment → fetch stock prices → calculate predictions.

**Response:**
```json
{
  "success": true,
  "tickersFound": 13,
  "results": [
    {
      "ticker": "SMCI",
      "mentions": 4,
      "finalScore": -0.658,
      "signal": "SELL",
      "sentiments": {
        "positive": 1,
        "negative": 3,
        "neutral": 0
      },
      "topPosts": [
        {
          "title": "Super Micro Dives...",
          "score": 1456,
          "sentiment": "negative",
          "sentimentScore": -0.9,
          "reason": "execs smuggled chips to China",
          "url": "https://...",
          "createdAt": "2026-03-20T00:09:15+00:00"
        }
      ],
      "stock": {
        "ticker": "SMCI",
        "name": "Super Micro Computer Inc",
        "price": 22.16,
        "change": -8.52,
        "changePercent": -27.33,
        "volume": 45000000,
        "high": 28.40,
        "low": 21.50
      },
      "prediction": {
        "predictionScore": 9,
        "combinedScore": -0.825,
        "signal": "STRONG SELL",
        "confidence": "High",
        "breakdown": {
          "sentiment":  { "value": -0.658, "weight": 0.40, "contribution": -0.263, "label": "Bearish" },
          "velocity":   { "value": 1.0,    "weight": 0.25, "contribution": -0.250, "label": "High buzz" },
          "momentum":   { "value": -1.0,   "weight": 0.20, "contribution": -0.200, "label": "Downtrend" },
          "conviction": { "value": -0.75,  "weight": 0.15, "contribution": -0.112, "label": "High conviction" }
        }
      }
    }
  ],
  "timestamp": "2026-03-20T14:13:09.843Z"
}
```

**Response time:** ~3-4 minutes (scraping + LLM analysis for 50+ posts)

---

### `GET /api/reddit/latest`

Scrapes and returns raw Reddit posts without sentiment analysis.

**Response:**
```json
{
  "success": true,
  "count": 80,
  "posts": [
    {
      "title": "TSLA earnings next week...",
      "body": "",
      "score": 4500,
      "numComments": 342,
      "subreddit": "r/wallstreetbets",
      "url": "https://old.reddit.com/...",
      "createdAt": "2026-03-20T10:00:00+00:00"
    }
  ]
}
```

---

## 10. Project Structure

```
reddit-sentiment/
├── server/
│   ├── data/
│   │   └── mockSentiment.js      # Cached sentiment results (saves Groq tokens during dev)
│   ├── models/                   # MongoDB models (reserved for future persistence)
│   ├── routes/
│   │   ├── reddit.js             # GET /api/reddit/latest
│   │   └── analysis.js           # GET /api/analysis/run
│   ├── services/
│   │   ├── redditService.js      # Puppeteer scraper
│   │   ├── sentimentService.js   # Groq/Llama analysis + aggregation
│   │   ├── stockService.js       # Yahoo Finance price fetching
│   │   └── predictionService.js  # Multi-signal prediction algorithm
│   ├── .env                      # API keys (never commit this)
│   └── index.js                  # Express server entry point
└── client/
    └── src/
        ├── components/
        │   ├── TickerCard.jsx     # Individual stock card with expandable posts
        │   ├── SignalBadge.jsx    # BUY/SELL/HOLD colored badge
        │   └── ScoreBar.jsx      # 0-100 visual score bar
        ├── api.js                 # API call functions
        ├── App.jsx                # Main dashboard with filters and sorting
        └── index.css              # Global dark theme styles
```

---

## 11. Setup & Installation

### Prerequisites

- Node.js v18+
- A Groq API key (free at console.groq.com)

### Steps

```bash
# 1. Clone and install server dependencies
cd server
npm install

# 2. Create environment file
touch .env
```

Add to `.env`:
```env
PORT=5000
GROQ_API_KEY=your_groq_api_key_here
```

```bash
# 3. Start the server
npm run dev

# 4. Install and start the frontend (new terminal)
cd ../client
npm install
npm run dev
```

Open `http://localhost:5173`

---

## 12. Key Design Decisions

### Why Not Use Reddit's Official API?

Reddit's API requires account approval and has strict rate limits since the 2023 API policy changes. Puppeteer with `old.reddit.com` provides equivalent data without any credentials and is more resilient to API policy changes.

### Why Groq Instead of OpenAI?

Groq provides a **free tier** with 14,400 requests/day, runs Llama 3.3 70B at very high speed (faster than GPT-4), and requires no credit card. For a portfolio project processing 50-100 posts, the free tier is more than sufficient.

### Why old.reddit.com?

The new Reddit UI is a React SPA where content is dynamically rendered. `old.reddit.com` uses server-rendered HTML with stable, predictable CSS classes that have not changed in years — making it far more reliable for scraping.

### Why Weight by Upvotes?

Not all Reddit posts carry equal weight. A post with 50,000 upvotes represents community consensus — tens of thousands of people agreed enough to vote. A post with 2 upvotes is one person's opinion. The weighted average ensures community-validated posts dominate the sentiment signal.

### Why Direct Yahoo Finance HTTP Instead of a Package?

The `yahoo-finance2` package had breaking changes in its v3 API that conflicted with our ES module setup. Since the package simply wraps the same HTTP endpoint we call directly, removing it eliminated complexity with zero loss of functionality.

### Why Mock Sentiment Data During Development?

Running the full Groq analysis pipeline (50 posts × 1 API call each) consumes tokens and takes 2-3 minutes. During frontend development where we're iterating on UI components, using cached sentiment results allows instant reloads without burning API quota. The mock data is replaced by live Groq calls in production.

---

## 13. Limitations & Future Improvements

### Current Limitations

**Scraping fragility:** If Reddit changes `old.reddit.com`'s HTML structure, the scraper breaks. Mitigation: add selector fallbacks and monitoring.

**No historical data:** The weighted sentiment algorithm has no memory — it can't learn that TSLA sentiment is typically bullish and adjust for baseline. A future ML model (XGBoost) would learn these baselines from historical data.

**Single snapshot:** The analysis is a point-in-time snapshot. Sentiment can change rapidly — a stock trending positive at 9am might reverse by 2pm. Scheduled polling (via `node-cron`) every 30-60 minutes would provide fresher signals.

**No volume baseline:** Mention velocity is relative to other stocks in the same scan. If all stocks have low mentions one day, the relative velocity is meaningless. An absolute mentions-per-day baseline from historical data would improve this signal.

**Body text missing:** Reddit post bodies aren't loaded in list view on old.reddit.com — the scraper only gets titles. Fetching each post's individual page for the full body would improve LLM context but increase scraping time significantly.

### Planned Improvements

**XGBoost ML Model:** Collect 3+ months of (sentiment, price_next_day) pairs → train a gradient boosted tree classifier → replace the weighted algorithm with a model that learns from actual outcomes.

**Database persistence:** Store every analysis run in MongoDB → enable historical charts, trend detection, accuracy tracking over time.

**Real-time updates:** Replace the manual Refresh button with WebSocket-based live updates every 30 minutes using `node-cron` + Socket.io.

**OCR for image posts:** Many WSB posts are screenshots of brokerage accounts or news articles. Adding Tesseract OCR to extract text from image posts would capture signals currently missed.

**Multi-source sentiment:** Add Twitter/X, StockTwits, and news headlines alongside Reddit for a more robust signal.

**Backtesting engine:** Build a historical simulator to test: "If I had followed these signals over the past 6 months, what would my returns have been?"

---

## Disclaimer

This project is for educational and portfolio purposes only. The predictions generated are based on Reddit sentiment and should not be used as financial advice. Always conduct your own research before making investment decisions.

---

*Built with Node.js, Puppeteer, Groq (Llama 3.3 70B), Yahoo Finance, and React.*
