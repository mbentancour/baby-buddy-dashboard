export default function SectionCard({ title, icon, children, color }) {
  return (
    <div
      style={{
        background: "var(--card-bg)",
        borderRadius: 16,
        border: "1px solid var(--border)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: `${color}15`,
            color: color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
          }}
        >
          {icon}
        </div>
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--text)",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </span>
      </div>
      <div style={{ padding: "16px 20px" }}>{children}</div>
    </div>
  );
}
