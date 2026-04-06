# RedditPulse — Frontend

Frontend client for Reddit-driven stock sentiment analysis and prediction system.

---

## Overview

React (Vite) application that consumes `/api/analysis/run` and renders:

* Aggregated ticker-level sentiment
* Prediction scores (0–100)
* Signal classification (BUY / SELL / HOLD)
* Supporting Reddit post data

The UI is optimized for fast scanning, filtering, and comparison across tickers.

---

## Tech Stack

* **React (Vite)**
* **JavaScript (ES6+)**
* **CSS + inline styles**
* No external state management (uses React hooks)
* No UI libraries (custom components only)

---

## Project Structure

```
src/
├── components/
│   ├── TickerCard.jsx     # Core rendering unit per ticker
│   ├── ScoreBar.jsx       # Score visualization (0–100)
│   └── SignalBadge.jsx    # Signal classification UI
│
├── App.jsx                # Data fetching, filtering, sorting, layout
├── api.js                 # API abstraction layer
├── index.css              # Global styles
```

---

## Data Contract (Backend → Frontend)

Expected API:

```
GET /api/analysis/run
```

Minimal shape:

```json
{
  "timestamp": "ISO string",
  "tickersFound": number,
  "results": [
    {
      "ticker": "string",
      "mentions": number,
      "stock": {
        "price": number,
        "changePercent": number,
        "name": "string"
      },
      "sentiments": {
        "positive": number,
        "negative": number,
        "neutral": number
      },
      "prediction": {
        "predictionScore": number,
        "signal": "STRONG BUY | BUY | HOLD | SELL | STRONG SELL",
        "confidence": "High | Medium | Low",
        "breakdown": object
      },
      "topPosts": [
        {
          "title": "string",
          "score": number,
          "sentiment": "positive | negative | neutral",
          "reason": "string",
          "url": "string"
        }
      ]
    }
  ]
}
```

---

## Core Logic

### Data Fetching

* Triggered on initial mount (`useEffect`)
* Manual refresh via UI button
* Single API call → entire dataset loaded into memory

```js
const result = await fetchAnalysis();
setData(result);
```

---

### Filtering

Client-side filtering:

```js
r.prediction.signal === filter
```

Supported filters:

* ALL
* STRONG BUY
* BUY
* HOLD
* SELL
* STRONG SELL

---

### Sorting

Client-side sorting:

```js
// score (default)
b.prediction.predictionScore - a.prediction.predictionScore

// mentions
b.mentions - a.mentions

// volatility
Math.abs(b.stock.changePercent) - Math.abs(a.stock.changePercent)
```

---

### Rendering Flow

```
API response
   ↓
App state
   ↓
filter + sort
   ↓
map → TickerCard[]
   ↓
subcomponents (ScoreBar, SignalBadge)
```

---

## Component Responsibilities

### TickerCard

* Primary rendering unit
* Handles:

  * ticker identity
  * price + % change
  * prediction + confidence
  * sentiment distribution
  * expandable Reddit posts
* Maintains local UI state (`expanded`)

---

### ScoreBar

* Stateless
* Maps score → visual width (0–100%)
* Color thresholds:

  * ≥65 → bullish
  * 45–65 → neutral
  * <45 → bearish

---

### SignalBadge

* Maps signal string → color scheme
* Pure presentation logic

---

## State Management

Local React state only:

```js
data       // full API response
loading    // boolean
error      // string
filter     // string
sortBy     // string
```

No global store required due to single-page data scope.

---

## Performance Characteristics

* Entire dataset held in memory (no pagination)
* Sorting + filtering are O(n log n) per render
* No memoization currently (acceptable for small n)
* Re-render triggered on:

  * data fetch
  * filter change
  * sort change

---

## Styling

* Inline styles for component-level control
* Global CSS for base theme and scrollbars
* Dark theme by default

---

## Running Locally

```bash
cd client
npm install
npm run dev
```

Default:

```
http://localhost:5173
```

---

## Backend Dependency

Requires backend running at:

```
http://localhost:5000
```

---

## Known Limitations

* Blocking API call (~2–4 min latency)
* No caching layer
* No pagination / virtualization
* No retry/backoff strategy
* No request cancellation

---

## Suggested Improvements

### High Priority

* Add response caching (frontend or backend)
* Introduce request timeout + retry logic
* Memoize sorted/filtered results (`useMemo`)

### Medium

* Add search (ticker-based)
* Add virtualization for large datasets
* Split API: metadata vs detailed posts

### Advanced

* WebSocket-based updates
* Persist last successful response (localStorage)
* Incremental loading (streaming results)

---

## Notes

* UI is intentionally minimal — focus is on data clarity
* Assumes backend guarantees schema correctness
* No defensive schema validation currently

---

## Disclaimer

Not financial advice. Experimental system based on social sentiment.
