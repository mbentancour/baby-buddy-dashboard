export default function DiaperBadge({ type }) {
  const bg =
    type === "solid" ? "#D97706" : type === "both" ? "#8B5CF6" : "#3B82F6";
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 10,
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: 6,
        background: `${bg}18`,
        color: bg,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
      }}
    >
      {type}
    </span>
  );
}
