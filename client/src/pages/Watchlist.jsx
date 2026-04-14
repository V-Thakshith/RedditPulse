import { useEffect, useState } from "react";
import { getWatchlistInsights, removeFromWatchlist } from "../api";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  ReferenceDot,
} from "recharts";

function evaluatePrediction(first, latest) {
  if (!first || !latest) return null;

  const priceChange = latest.price - first.price;

  if (first.signal === "BUY" && priceChange > 0) return true;
  if (first.signal === "STRONG BUY" && priceChange > 0) return true;
  if (first.signal === "SELL" && priceChange < 0) return true;
  if (first.signal === "STRONG SELL" && priceChange < 0) return true;
  if (first.signal === "HOLD") return true;

  return false;
}

export default function Watchlist() {
  const [data, setData] = useState([]);
  const [confirmTicker, setConfirmTicker] = useState(null); // 🔥 dialog state
  const navigate = useNavigate();

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const res = await getWatchlistInsights();
    setData(res);
  }

  async function handleRemove() {
    if (!confirmTicker) return;

    await removeFromWatchlist(confirmTicker);

    setData((prev) =>
      prev.filter((item) => item.ticker !== confirmTicker)
    );

    setConfirmTicker(null);
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

        <button
          onClick={() => navigate("/dashboard")}
          style={{
            padding: "0.5rem 1.2rem",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "transparent",
            color: "#94a3b8",
            cursor: "pointer",
            fontSize: "0.8rem",
            fontWeight: 600,
          }}
        >
          ← Back
        </button>
      </div>

      {/* Empty */}
      {data.length === 0 && (
        <div style={{ textAlign: "center", color: "#64748b" }}>
          Your watchlist is empty ⭐
        </div>
      )}

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

          const predictionTime = item.predictionTime;

          const predictionPoint = history.reduce((closest, point) => {
            if (!closest) return point;

            return Math.abs(point.timestamp - predictionTime) <
              Math.abs(closest.timestamp - predictionTime)
              ? point
              : closest;
          }, null);

          const latest = history[history.length - 1];

          const signal = item.prediction?.prediction?.signal;

          const isCorrect = evaluatePrediction(
            { ...predictionPoint, signal },
            latest
          );

          const percentChange =
            predictionPoint && latest
              ? ((latest.price - predictionPoint.price) /
                  predictionPoint.price) *
                100
              : 0;

          const alignedPredictionTime = predictionPoint?.timestamp;

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
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.5rem",
                }}
              >
                <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                  {item.ticker}
                </div>

                {/* ⭐ Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmTicker(item.ticker);
                  }}
                  style={{
                    padding: "0.3rem 0.6rem",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background:
                      "linear-gradient(135deg, #f97316, #ef4444)",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.target.innerText = "✕ Remove";
                  }}
                  onMouseLeave={(e) => {
                    e.target.innerText = "⭐ Saved";
                  }}
                >
                  ⭐ Saved
                </button>
              </div>

              {/* Price */}
              <div style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
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
                    tickCount={4}
                  />

                  <YAxis
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    domain={["auto", "auto"]}
                  />

                  <ReferenceLine
                    x={alignedPredictionTime}
                    stroke="#f97316"
                    strokeDasharray="4 4"
                    label={{
                      value: "Prediction",
                      position: "top",
                      fill: "#f97316",
                      fontSize: 10,
                    }}
                  />

                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      fontSize: "0.75rem",
                    }}
                    labelFormatter={(t) =>
                      new Date(t).toLocaleString()
                    }
                  />

                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#4ade80"
                    strokeWidth={2}
                    dot={false}
                  />

                  {predictionPoint && (
                    <ReferenceDot
                      x={predictionPoint.timestamp}
                      y={predictionPoint.price}
                      r={6}
                      fill={
                        signal === "BUY" || signal === "STRONG BUY"
                          ? "#4ade80"
                          : signal === "SELL" ||
                            signal === "STRONG SELL"
                          ? "#f87171"
                          : "#facc15"
                      }
                      stroke="white"
                    />
                  )}
                </LineChart>
              )}

              {/* Result */}
              {isCorrect !== null && (
                <div
                  style={{
                    marginTop: "0.5rem",
                    fontSize: "0.8rem",
                    color: isCorrect ? "#4ade80" : "#f87171",
                  }}
                >
                  {isCorrect ? "✓ Correct" : "✗ Wrong"}
                </div>
              )}

              {/* % */}
              <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                {percentChange.toFixed(2)}% since prediction
              </div>
            </div>
          );
        })}
      </div>

      {/* 🔥 Confirmation Dialog */}
      {confirmTicker && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#0f172a",
              padding: "1.5rem",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.1)",
              width: 300,
              textAlign: "center",
            }}
          >
            <div style={{ marginBottom: "1rem", fontSize: "0.9rem" }}>
              Remove <b>{confirmTicker}</b> from watchlist?
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => setConfirmTicker(null)}
                style={{
                  flex: 1,
                  padding: "0.5rem",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#94a3b8",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleRemove}
                style={{
                  flex: 1,
                  padding: "0.5rem",
                  borderRadius: 8,
                  background:
                    "linear-gradient(135deg, #f97316, #ef4444)",
                  border: "none",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
