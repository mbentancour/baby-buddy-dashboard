export default function ChartDetailBar({ label, value, unit, color, onViewEntries, onDismiss, actionLabel = "View entries" }) {
  if (!label) return null;
  return (
    <div
      style={{
        marginTop: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "6px 12px",
        borderRadius: 8,
        background: `${color}12`,
        border: `1px solid ${color}25`,
        fontSize: 12,
      }}
    >
      <span style={{ color: "var(--text)" }}>
        <strong style={{ color }}>{label}</strong>
        {" — "}
        {value} {unit}
      </span>
      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={onViewEntries}
          style={{
            padding: "3px 10px",
            fontSize: 11,
            fontWeight: 600,
            color,
            background: `${color}20`,
            border: `1px solid ${color}30`,
            borderRadius: 6,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {actionLabel}
        </button>
        <button
          onClick={onDismiss}
          style={{
            padding: "3px 6px",
            fontSize: 11,
            color: "var(--text-dim)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
