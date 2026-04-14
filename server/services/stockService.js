// Using Yahoo Finance's unofficial API directly — no package needed
export async function getStockData(ticker) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];

    if (!result) throw new Error("No data returned");

    const meta = result.meta;

    return {
      ticker,
      name: meta.longName || meta.shortName || ticker,
      price: parseFloat(meta.regularMarketPrice?.toFixed(2)),
      change: parseFloat((meta.regularMarketPrice - meta.chartPreviousClose).toFixed(2)),
      changePercent: parseFloat(
        (((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100).toFixed(2)
      ),
      volume: meta.regularMarketVolume,
      high: meta.regularMarketDayHigh,
      low: meta.regularMarketDayLow,
      previousClose: meta.chartPreviousClose,
      currency: meta.currency,
    };

  } catch (err) {
    console.error(`Failed to get stock data for ${ticker}:`, err.message);
    return null;
  }
}

export async function getStockDataForTickers(tickers) {
  console.log(`✦ Fetching stock prices for ${tickers.length} tickers...`);

  const results = {};

  for (const ticker of tickers) {
    const data = await getStockData(ticker);
    if (data) {
      results[ticker] = data;
      console.log(`  ✓ ${ticker}: $${data.price} (${data.changePercent > 0 ? "+" : ""}${data.changePercent}%)`);
    }
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`✦ Got price data for ${Object.keys(results).length}/${tickers.length} tickers`);
  return results;
}

const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 60 minutes

export async function getYahooHistory(ticker) {
  try {
    const now = Date.now();

    // ✅ Cache check
    if (cache.has(ticker)) {
      const { data, timestamp } = cache.get(ticker);

      if (now - timestamp < CACHE_TTL) {
        return data;
      }
    }

    // 🔥 Yahoo chart API (7 days)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=7d`;

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];

    if (!result) throw new Error("No data returned");

    const timestamps = result.timestamp;
    const prices = result.indicators.quote[0].close;

    const formatted = timestamps.map((t, i) => ({
      timestamp: t * 1000, // convert seconds → ms
      price: prices[i],
    })).filter(p => p.price !== null);

    cache.set(ticker, {
      data: formatted,
      timestamp: now,
    });

    return formatted;

  } catch (err) {
    console.error(`Yahoo history error for ${ticker}:`, err.message);
    return [];
  }
}
