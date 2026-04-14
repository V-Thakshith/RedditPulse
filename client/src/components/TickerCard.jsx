import { useState } from "react";
import SignalBadge from "./SignalBadge";
import ScoreBar from "./ScoreBar";
import { addToWatchlist, removeFromWatchlist } from "../api";
export default function TickerCard({ result, watchlist, setWatchlist }) {
  const [expanded, setExpanded] = useState(false);
  const isSaved = watchlist?.includes(result.ticker);

  async function toggleWatchlist() {
    let updated;

    if (isSaved) {
      updated = await removeFromWatchlist(result.ticker);
    } else {
      updated = await addToWatchlist(result.ticker);
    }

    setWatchlist(updated);
  }
  const { ticker, mentions, prediction, stock, topPosts, sentiments } =
    result || {};

  const priceColor = stock?.changePercent >= 0 ? "#4ade80" : "#f87171";

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 16,
        padding: "1.2rem",
        transition: "border-color 0.2s",
        cursor: "pointer",
      }}
      onClick={() => setExpanded((prev) => !prev)}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#f97316")}
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")
      }
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "1rem",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              marginBottom: "0.3rem",
            }}
          >
            <span
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: "1.3rem",
              }}
            >
              ${ticker}
            </span>
            <SignalBadge signal={prediction?.signal} />
          </div>

          <div style={{ fontSize: "0.78rem", color: "#475569" }}>
            {stock?.name || ticker}
          </div>
        </div>

        {/* Price */}
        {stock && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>
              ${stock.price}
            </div>
            <div
              style={{
                fontSize: "0.8rem",
                color: priceColor,
                fontWeight: 600,
              }}
            >
              {stock.changePercent >= 0 ? "+" : ""}
              {stock.changePercent}%
            </div>
          </div>
        )}
        <button
          onClick={toggleWatchlist}
          style={{
            padding: "0.3rem 0.6rem",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.08)",
            background: isSaved
              ? "linear-gradient(135deg, #f97316, #ef4444)"
              : "rgba(255,255,255,0.05)",
            color: isSaved ? "#fff" : "#94a3b8",
            cursor: "pointer",
            fontSize: "0.9rem",
            fontWeight: 600,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            if (!isSaved) {
              e.target.style.borderColor = "#f97316";
              e.target.style.color = "#f97316";
            }
          }}
          onMouseLeave={(e) => {
            if (!isSaved) {
              e.target.style.borderColor = "rgba(255,255,255,0.08)";
              e.target.style.color = "#94a3b8";
            }
          }}
        >
          {isSaved ? "⭐ Saved" : "☆ Save"}
        </button>
      </div>

      {/* Score Bar */}
      <div style={{ marginBottom: "1rem" }}>
        <ScoreBar score={prediction?.predictionScore} />
      </div>

      {/* Stats row */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "0.8rem",
        }}
      >
        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
          <span style={{ color: "#94a3b8", fontWeight: 600 }}>{mentions}</span>{" "}
          mentions
        </div>

        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
          Confidence:{" "}
          <span style={{ color: "#94a3b8", fontWeight: 600 }}>
            {prediction?.confidence}
          </span>
        </div>

        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
          <span style={{ color: "#4ade80" }}>+{sentiments?.positive || 0}</span>
          {" / "}
          <span style={{ color: "#fde047" }}>{sentiments?.neutral || 0}</span>
          {" / "}
          <span style={{ color: "#f87171" }}>-{sentiments?.negative || 0}</span>
        </div>
      </div>

      {/* Breakdown */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.4rem",
          marginBottom: "0.8rem",
        }}
      >
        {Object.entries(prediction?.breakdown || {}).map(([key, val]) => (
          <div
            key={key}
            style={{
              padding: "0.4rem 0.6rem",
              background: "rgba(255,255,255,0.02)",
              borderRadius: 8,
              fontSize: "0.72rem",
            }}
          >
            <div
              style={{
                color: "#475569",
                textTransform: "capitalize",
                marginBottom: "0.2rem",
              }}
            >
              {key}
            </div>
            <div
              style={{
                color: "#94a3b8",
                fontWeight: 600,
              }}
            >
              {val?.label}
            </div>
          </div>
        ))}
      </div>

      {/* Expanded posts */}
      {expanded && (
        <div
          style={{
            marginTop: "0.8rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          {topPosts?.map((post, i) => (
            <a
              key={post?.id || post?.url || i}
              href={post?.url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "block",
                padding: "0.6rem 0.8rem",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.04)",
                borderRadius: 8,
                textDecoration: "none",
              }}
              onClick={(e) => e.stopPropagation()} // prevent toggle when clicking link
            >
              <div
                style={{
                  fontSize: "0.78rem",
                  color: "#cbd5e1",
                  marginBottom: "0.3rem",
                  lineHeight: 1.4,
                }}
              >
                {post?.title}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "0.8rem",
                  fontSize: "0.7rem",
                  color: "#475569",
                }}
              >
                <span>▲ {post?.score?.toLocaleString?.() || 0}</span>

                <span
                  style={{
                    color:
                      post?.sentiment === "positive"
                        ? "#4ade80"
                        : post?.sentiment === "negative"
                          ? "#f87171"
                          : "#fde047",
                  }}
                >
                  {post?.sentiment}
                </span>

                <span style={{ color: "#334155" }}>{post?.reason}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
