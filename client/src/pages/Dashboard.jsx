
import { useState, useEffect } from "react";
import { fetchAnalysis } from "../api";
import TickerCard from "../components/TickerCard";
import { useAuth } from "../context/AuthContext";

const FILTERS = ["ALL", "STRONG BUY", "BUY", "HOLD", "SELL", "STRONG SELL"];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("score");

  const { logout } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchAnalysis();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = data?.results
    ?.filter(r => filter === "ALL" || r.prediction.signal === filter)
    ?.sort((a, b) => {
      if (sortBy === "score") return b.prediction.predictionScore - a.prediction.predictionScore;
      if (sortBy === "mentions") return b.mentions - a.mentions;
      if (sortBy === "change") return Math.abs(b.stock?.changePercent || 0) - Math.abs(a.stock?.changePercent || 0);
      return 0;
    }) || [];

  return (
    <div style={{ minHeight: "100vh", padding: "1.5rem 2rem", maxWidth: 1400, margin: "0 auto" }}>
{/* Header */}
<div style={{ marginBottom: "2rem" }}>
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: "1rem",
    }}
  >
    {/* Left */}
    <div>
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
        RedditPulse
      </h1>
    </div>

    {/* Right */}
    <div style={{ display: "flex", gap: "0.6rem" }}>
      {/* Refresh */}
      <button
        onClick={loadData}
        disabled={loading}
        style={{
          padding: "0.55rem 1.2rem",
          borderRadius: 999,
          border: "none",
          cursor: loading ? "not-allowed" : "pointer",
          fontWeight: 700,
          fontFamily: "'Syne', sans-serif",
          fontSize: "0.8rem",
          background: loading
            ? "#1e293b"
            : "linear-gradient(135deg, #f97316, #ef4444)",
          color: "#fff",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? "Analyzing..." : "↻ Refresh"}
      </button>

      {/* Logout */}
      <button
        onClick={logout}
        style={{
          padding: "0.55rem 1.2rem",
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "transparent",
          color: "#94a3b8",
          cursor: "pointer",
          fontSize: "0.8rem",
          fontWeight: 600,
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          e.target.style.borderColor = "#f97316";
          e.target.style.color = "#f97316";
        }}
        onMouseLeave={(e) => {
          e.target.style.borderColor = "rgba(255,255,255,0.08)";
          e.target.style.color = "#94a3b8";
        }}
      >
        Logout
      </button>
    </div>
  </div>
</div>

      {/* Loading */}
      {loading && <div>Loading...</div>}

      {/* Error */}
      {error && <div>Error: {error}</div>}

      {/* Grid */}
      {!loading && !error && (
        <div>
          {filtered.map(result => (
            <TickerCard key={result.ticker} result={result} />
          ))}
        </div>
      )}
    </div>
  );
}

