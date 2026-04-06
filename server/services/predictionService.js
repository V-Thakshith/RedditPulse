// Normalize any value to -1 to +1 range
function normalize(value, min, max) {
  if (max === min) return 0;
  return ((value - min) / (max - min)) * 2 - 1;
}

function safeNumber(n) {
  return isNaN(n) ? 0 : n;
}

// Convert -1/+1 score to 0-100 for display
function toDisplayScore(score) {
  return Math.round(((score + 1) / 2) * 100);
}

// Signal 1 — Sentiment Score (already -1 to +1)
function getSentimentSignal(finalScore) {
  return finalScore; // already normalized
}

// Signal 2 — Mention Velocity
// More mentions = stronger signal (max expected ~10 for a hot stock)
function getMentionVelocitySignal(mentions, allResults) {
  const allMentions = allResults.map(r => r.mentions);
  const maxMentions = Math.max(...allMentions);
  const minMentions = Math.min(...allMentions);

  // Normalize mentions to 0-1 (not -1 to +1)
  // because more mentions = stronger signal in EITHER direction
  const normalized = maxMentions === minMentions
    ? 0.5
    : (mentions - minMentions) / (maxMentions - minMentions);

  // Multiply by sentiment direction to get -1 to +1
  return normalized; // we apply direction when combining
}

// Signal 3 — Price Momentum
// Cap at ±15% change to avoid outliers like PL (+27%)
function getPriceMomentumSignal(changePercent) {
  if (changePercent === null || changePercent === undefined || isNaN(changePercent)) {
    return 0;
  }

  const capped = Math.max(-15, Math.min(15, changePercent));
  return capped / 15;
}

// Signal 4 — Conviction Score
// How unanimous is the Reddit sentiment?
function getConvictionSignal(sentiments, finalScore) {
  const total = (sentiments.positive || 0) +
                (sentiments.negative || 0) +
                (sentiments.neutral || 0);

  if (total === 0) return 0;

  const dominant = Math.max(
    sentiments.positive || 0,
    sentiments.negative || 0
  );

  // Conviction = what % of posts agree (0 to 1)
  const conviction = dominant / total;

  // Apply direction from finalScore
  const direction = finalScore >= 0 ? 1 : -1;

  return conviction * direction;
}

// Combine all signals into final prediction
export function calculatePredictionScore(result, allResults) {
  const { finalScore, mentions, sentiments, stock } = result;

  // Get each signal
  const sentimentSignal    = getSentimentSignal(finalScore);
  const velocitySignal     = getMentionVelocitySignal(mentions, allResults);
  const momentumSignal     = getPriceMomentumSignal(stock?.changePercent);
  const convictionSignal   = getConvictionSignal(sentiments, finalScore);

  // Weights
  const WEIGHTS = {
    sentiment:  0.40,
    velocity:   0.25,
    momentum:   0.20,
    conviction: 0.15,
  };

  // Velocity signal needs direction applied
  const velocityWithDirection = velocitySignal * (finalScore >= 0 ? 1 : -1);

  // Weighted combination
const combinedScore =
  safeNumber(sentimentSignal * WEIGHTS.sentiment) +
  safeNumber(velocityWithDirection * WEIGHTS.velocity) +
  safeNumber(momentumSignal * WEIGHTS.momentum) +
  safeNumber(convictionSignal * WEIGHTS.conviction);

  // Convert to 0-100 display score
const displayScore = safeNumber(toDisplayScore(combinedScore));

  // Generate signal with confidence levels
  let signal, confidence;

  if (combinedScore > 0.5) {
    signal = "STRONG BUY";
    confidence = "High";
  } else if (combinedScore > 0.2) {
    signal = "BUY";
    confidence = "Medium";
  } else if (combinedScore > -0.2) {
    signal = "HOLD";
    confidence = "Low";
  } else if (combinedScore > -0.5) {
    signal = "SELL";
    confidence = "Medium";
  } else {
    signal = "STRONG SELL";
    confidence = "High";
  }

  return {
    predictionScore: displayScore,      // 0-100 for display
    combinedScore: parseFloat(combinedScore.toFixed(3)), // -1 to +1 raw
    signal,
    confidence,
    breakdown: {
      sentiment: {
        value: parseFloat(sentimentSignal.toFixed(3)),
        weight: WEIGHTS.sentiment,
        contribution: parseFloat((sentimentSignal * WEIGHTS.sentiment).toFixed(3)),
        label: sentimentSignal > 0.3 ? "Bullish" : sentimentSignal < -0.3 ? "Bearish" : "Neutral"
      },
      velocity: {
        value: parseFloat(velocitySignal.toFixed(3)),
        weight: WEIGHTS.velocity,
        contribution: parseFloat((velocityWithDirection * WEIGHTS.velocity).toFixed(3)),
        label: velocitySignal > 0.6 ? "High buzz" : velocitySignal > 0.3 ? "Moderate buzz" : "Low buzz"
      },
      momentum: {
        value: parseFloat(momentumSignal.toFixed(3)),
        weight: WEIGHTS.momentum,
        contribution: parseFloat((momentumSignal * WEIGHTS.momentum).toFixed(3)),
        label: momentumSignal > 0.2 ? "Uptrend" : momentumSignal < -0.2 ? "Downtrend" : "Flat"
      },
      conviction: {
        value: parseFloat(convictionSignal.toFixed(3)),
        weight: WEIGHTS.conviction,
        contribution: parseFloat((convictionSignal * WEIGHTS.conviction).toFixed(3)),
        label: Math.abs(convictionSignal) > 0.6 ? "High conviction" : "Mixed signals"
      }
    }
  };
}

// Apply prediction scores to all results
export function enrichWithPredictions(results) {
  return results.map(result => ({
    ...result,
    prediction: calculatePredictionScore(result, results)
  }));
}