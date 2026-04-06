export default function ScoreBar({ score, size = "normal" }) {
  const color = score >= 65 ? "#4ade80"
              : score >= 45 ? "#fde047"
              : "#f87171";

  const height = size === "small" ? 4 : 6;

  return (
    <div style={{ width: "100%" }}>
      <div style={{
        display: "flex", justifyContent: "space-between",
        fontSize: "0.72rem", color: "#475569", marginBottom: "0.3rem"
      }}>
        <span>Bearish</span>
        <span style={{ color, fontWeight: 700 }}>{score}/100</span>
        <span>Bullish</span>
      </div>
      <div style={{
        width: "100%", height, background: "#1e293b",
        borderRadius: 999, overflow: "hidden"
      }}>
        <div style={{
          width: `${score}%`, height: "100%",
          background: `linear-gradient(90deg, #ef4444, #eab308, #4ade80)`,
          borderRadius: 999,
          transition: "width 0.8s ease"
        }} />
      </div>
    </div>
  );
}