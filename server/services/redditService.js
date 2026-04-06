import puppeteer from "puppeteer";

// Scrape hot and new posts from WSB + stocks subreddits
export async function fetchLatestPosts(limit = 100) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const posts = [];

  try {
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Scrape these feeds
    const feeds = [
      "https://old.reddit.com/r/wallstreetbets/hot/",
      "https://old.reddit.com/r/wallstreetbets/new/",
      "https://old.reddit.com/r/stocks/hot/",
      "https://old.reddit.com/r/investing/hot/",
    ];

    for (const url of feeds) {
      try {
        console.log(`Scraping ${url}...`);

        await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

        await page.waitForSelector("div.thing", { timeout: 10000 })
          .catch(() => console.log(`  No posts found at ${url}`));

        const scrapedPosts = await page.evaluate(() => {
          const results = [];
          const postElements = document.querySelectorAll("div.thing");

          postElements.forEach((el) => {
            // Title
            const titleEl = el.querySelector("a.title");
            const title = titleEl?.innerText?.trim();
            if (!title) return;

            // Body preview (flair or description if available)
            const bodyEl = el.querySelector(".expando .md p");
            const body = bodyEl?.innerText?.trim() || "";

            // Score
            const scoreEl = el.querySelector("div.score.unvoted, div.score.likes");
            const scoreText = scoreEl?.innerText?.trim() || "0";
            const score = scoreText === "•" ? 0 : parseInt(scoreText.replace(/,/g, "")) || 0;

            // Comments
            const commentEl = el.querySelector("a.comments");
            const commentText = commentEl?.innerText?.trim() || "0";
            const numComments = parseInt(commentText.replace(/,/g, "")) || 0;

            // Post URL
            const url = titleEl?.href || "";

            // Time
            const timeEl = el.querySelector("time");
            const createdAt = timeEl?.getAttribute("datetime") || new Date().toISOString();

            // Subreddit
            const subredditEl = el.querySelector("a.subreddit");
            const subreddit = subredditEl?.innerText?.trim() || "";

            results.push({
              title,
              body,
              score,
              numComments,
              subreddit,
              url,
              createdAt,
            });
          });

          return results;
        });

        console.log(`  Scraped ${scrapedPosts.length} posts`);
        posts.push(...scrapedPosts);

        // Delay between pages
        await new Promise(r => setTimeout(r, 2000));

      } catch (err) {
        console.error(`  Error scraping ${url}:`, err.message);
      }
    }

  } finally {
    await browser.close();
  }

  // Remove duplicates by title
  const unique = posts.filter((post, index, self) =>
    index === self.findIndex(p => p.title === post.title)
  );

  console.log(`✦ Total unique posts scraped: ${unique.length}`);

  // Return sorted by score
  return unique
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}