import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Analyze a single post — extract tickers + sentiment
export async function analyzePost(post) {
  const text = `${post.title}. ${post.body}`.slice(0, 600);

  const prompt = `You are a financial sentiment analyzer for Reddit posts.

Analyze this Reddit post from ${post.subreddit || "r/wallstreetbets"}:
"${text}"

Extract any stock tickers mentioned or clearly implied (e.g. "Tesla" implies TSLA).
For each ticker, determine the sentiment of the post toward that stock.

Rules:
- Only include real publicly traded stock tickers
- If no specific stock is mentioned, return empty array
- Sentiment score must be between -1.0 (very negative) and +1.0 (very positive)
- Consider Reddit slang: "to the moon" = very positive, "puts" = negative, "calls" = positive, "YOLO" = high risk bullish, "drill" = negative, "cooked" = very negative, "squeezed" = positive

Return ONLY this JSON, no explanation:
{
  "tickers": [
    {
      "ticker": "TSLA",
      "sentiment": "positive",
      "score": 0.85,
      "reason": "one line explanation"
    }
  ]
}`;

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
      temperature: 0.1, // low temperature = more consistent outputs
    });

    const content = response.choices[0].message.content.trim();

    // Strip markdown backticks if Groq wraps response in ```json ... ```
    const cleaned = content.replace(/```json|```/g, "").trim();

    const parsed = JSON.parse(cleaned);
    return parsed.tickers || [];

  } catch (err) {
    console.error(`Sentiment analysis failed for: "${post.title.slice(0, 50)}"`, err.message);
    return [];
  }
}

// Analyze all posts and group results by ticker
export async function analyzeAllPosts(posts) {
  console.log(`✦ Analyzing sentiment for ${posts.length} posts...`);

  const tickerMap = {}; // { TSLA: { mentions, posts, weightedScoreSum, totalWeight } }

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    process.stdout.write(`\r  Processing post ${i + 1}/${posts.length}...`);

    const tickers = await analyzePost(post);

    // Calculate this post's weight
    const weight = post.score + (post.numComments * 0.5);

    tickers.forEach(({ ticker, sentiment, score, reason }) => {
      if (!ticker || ticker.length > 5) return; // skip invalid tickers

      if (!tickerMap[ticker]) {
        tickerMap[ticker] = {
          ticker,
          mentions: 0,
          weightedScoreSum: 0,
          totalWeight: 0,
          posts: [],
          sentiments: { positive: 0, negative: 0, neutral: 0 }
        };
      }

      const t = tickerMap[ticker];
      t.mentions++;
      t.weightedScoreSum += score * weight;
      t.totalWeight += weight;
      t.sentiments[sentiment] = (t.sentiments[sentiment] || 0) + 1;
      t.posts.push({
        title: post.title,
        score: post.score,
        sentiment,
        sentimentScore: score,
        reason,
        url: post.url,
        subreddit: post.subreddit,
        createdAt: post.createdAt,
      });
    });

    // Small delay to avoid hitting Groq rate limits
    await new Promise(r => setTimeout(r, 200));
  }

  console.log("\n✦ Sentiment analysis complete");

  // Convert map to array and calculate final scores
  const results = Object.values(tickerMap).map((t) => {
    const finalScore = t.totalWeight > 0
      ? t.weightedScoreSum / t.totalWeight
      : 0;

    // Generate signal
    let signal;
    if (finalScore > 0.3)       signal = "BUY";
    else if (finalScore < -0.3) signal = "SELL";
    else                        signal = "HOLD";

    return {
      ticker: t.ticker,
      mentions: t.mentions,
      finalScore: parseFloat(finalScore.toFixed(3)),
      signal,
      sentiments: t.sentiments,
      topPosts: t.posts
        .sort((a, b) => b.score - a.score)
        .slice(0, 3), // top 3 most upvoted posts per ticker
    };
  });

  // Sort by mentions — most talked about first
  return results.sort((a, b) => b.mentions - a.mentions);
}