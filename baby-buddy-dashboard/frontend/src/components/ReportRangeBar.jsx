import { Icons } from "./Icons";
import { colors } from "../utils/colors";

export const RANGE_OPTIONS = [7, 14, 30, 90];

export default function ReportRangeBar({ rangeDays, setRangeDays, onExport, exportDisabled }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
      {RANGE_OPTIONS.map((d) => (
        <button
          key={d}
          onClick={() => setRangeDays(d)}
          style={{
            padding: "6px 14px",
            borderRadius: 20,
            border: rangeDays === d ? `1px solid ${colors.growth}60` : "1px solid var(--border)",
            background: rangeDays === d ? `${colors.growth}18` : "var(--bg)",
            color: rangeDays === d ? colors.growth : "var(--text-muted)",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {d}d
        </button>
      ))}
      <button
        onClick={onExport}
        disabled={exportDisabled}
        style={{
          marginLeft: "auto",
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 14px",
          borderRadius: 20,
          border: "1px solid var(--border)",
          background: "var(--bg)",
          color: "var(--text-muted)",
          fontSize: 12,
          fontWeight: 600,
          cursor: exportDisabled ? "default" : "pointer",
          opacity: exportDisabled ? 0.5 : 1,
          fontFamily: "inherit",
        }}
      >
        <Icons.Download /> CSV
      </button>
    </div>
  );
}
