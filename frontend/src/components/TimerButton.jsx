export default function TimerButton({ label, color, icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 16px",
        borderRadius: 12,
        border: active ? `2px solid ${color}` : "1px solid var(--border)",
        background: active ? `${color}12` : "var(--card-bg)",
        color: active ? color : "var(--text-muted)",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 600,
        transition: "all 0.2s",
        fontFamily: "inherit",
      }}
    >
      {icon}
      {label}
      {active && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: color,
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
      )}
    </button>
  );
}
