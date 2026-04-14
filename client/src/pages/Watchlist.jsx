import { useEffect, useState } from "react";
import { getWatchlistInsights, getHistory } from "../api";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceDot,
  CartesianGrid,
  ReferenceLine
} from "recharts";
function evaluatePrediction(first, latest) {
  if (!first || !latest) return null;

  const priceChange = latest.price - first.price;

  if (first.signal === "BUY" && priceChange > 0) return true;
  if (first.signal === "STRONG BUY" && priceChange > 0) return true;
  if (first.signal === "SELL" && priceChange < 0) return true;
  if (first.signal === "STRONG SELL" && priceChange < 0) return true;
  if (first.signal === "HOLD" && priceChange == 0) return true;

  return false;
}

export default function Watchlist() {
  const [data, setData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const res = await getWatchlistInsights();
    setData(res);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "1.5rem 2rem",
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: "2rem",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <h1
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: "2rem",
            background: "linear-gradient(135deg, #f97316, #ef4444)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          My Watchlist
        </h1>

        <button onClick={() => navigate("/dashboard")}>← Back</button>
      </div>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1rem",
        }}
      >
        {data.map((item) => {
          const history = item.history || [];

          const first = history[0];
          const latest = history[history.length - 1];

          const isCorrect = evaluatePrediction(first, latest);

          const percentChange =
            first && latest
              ? ((latest.price - first.price) / first.price) * 100
              : 0;

          const step = Math.ceil(history.length / 4);

let ticks = history
  .filter((_, i) => i % step === 0)
  .map(p => p.timestamp);

// always include last point
if (history.length > 0) {
  ticks.push(history[history.length - 1].timestamp);
}

          return (
            <div
              key={item.ticker}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 14,
                padding: "1rem",
              }}
            >
              <div style={{ fontWeight: 700 }}>{item.ticker}</div>

              <div style={{ color: "#94a3b8" }}>
                Price: {item.stock?.price ?? "N/A"}
              </div>

              {/* Chart */}
              {history.length > 0 && (
                <LineChart width={320} height={140} data={history}>
  
  <CartesianGrid stroke="rgba(255,255,255,0.05)" />

  <XAxis
  dataKey="timestamp"
  type="number"
  domain={["dataMin", "dataMax"]}
  tick={{ fontSize: 10, fill: "#64748b" }}
  tickFormatter={(t) => {
    const d = new Date(t);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  }}
  tickCount={4}   // 🔥 controls spacing
/>

  <YAxis
    tick={{ fontSize: 10, fill: "#64748b" }}
    domain={["auto", "auto"]}
  />

  <ReferenceLine
  x={item.predictionTime}
  stroke="#f97316"
  strokeDasharray="4 4"
  label="Prediction"
/>

  <Tooltip
    contentStyle={{
      background: "#0f172a",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 8,
      fontSize: "0.75rem",
    }}
    labelFormatter={(t) => new Date(t).toLocaleString()}
  />

  <Line
    type="monotone"
    dataKey="price"
    stroke="#4ade80"
    strokeWidth={2}
    dot={false}
  />

  {/* 🔥 Prediction Markers */}
  {history.map((point, index) => {
    if (!point.signal) return null;

    return (
      <ReferenceDot
        key={index}
        x={point.timestamp}
        y={point.price}
        r={5}
        fill={
          point.signal === "BUY"
            ? "#4ade80"
            : point.signal === "SELL"
            ? "#f87171"
            : "#facc15"
        }
        stroke="white"
      />
    );
  })}
</LineChart>
              )}

              {/* Prediction result */}
              {isCorrect !== null && (
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: isCorrect ? "#4ade80" : "#f87171",
                  }}
                >
                  {isCorrect ? "✓ Correct" : "✗ Wrong"}
                </div>
              )}

              {/* % change */}
              <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                {percentChange.toFixed(2)}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
