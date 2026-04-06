export default function SignalBadge({ signal }) {
  const colors = {
    "STRONG BUY":  { bg: "rgba(74,222,128,0.15)", color: "#4ade80", border: "rgba(74,222,128,0.3)" },
    "BUY":         { bg: "rgba(74,222,128,0.08)", color: "#86efac", border: "rgba(74,222,128,0.2)" },
    "HOLD":        { bg: "rgba(234,179,8,0.08)",  color: "#fde047", border: "rgba(234,179,8,0.2)"  },
    "SELL":        { bg: "rgba(249,115,22,0.08)", color: "#fb923c", border: "rgba(249,115,22,0.2)" },
    "STRONG SELL": { bg: "rgba(239,68,68,0.15)",  color: "#f87171", border: "rgba(239,68,68,0.3)"  },
  };

  const style = colors[signal] || colors["HOLD"];

  return (
    <span style={{
      padding: "0.3rem 0.8rem",
      borderRadius: 50,
      fontSize: "0.75rem",
      fontWeight: 700,
      letterSpacing: "0.05em",
      background: style.bg,
      color: style.color,
      border: `1px solid ${style.border}`,
      whiteSpace: "nowrap"
    }}>
      {signal}
    </span>
  );
}