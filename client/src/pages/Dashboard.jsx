
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
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <h1>RedditPulse</h1>
            <button onClick={logout}>Logout</button>
          </div>

          <button onClick={loadData} disabled={loading}>
            {loading ? "Analyzing..." : "↻ Refresh"}
          </button>
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

