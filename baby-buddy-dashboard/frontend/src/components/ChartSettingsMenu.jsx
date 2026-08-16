import { useState } from "react";
import { Icons } from "./Icons";
import { useTranslation } from "../locales";

export default function ChartSettingsMenu({ options, value, onChange, color }) {
  const t = useTranslation();
  const [open, setOpen] = useState(false);

  const toggle = (key) => {
    const next = { ...value, [key]: !value[key] };
    if (Object.values(next).filter(Boolean).length === 0) return;
    onChange(next);
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        title={t("common.chartSettings")}
        aria-label={t("common.chartSettings")}
        aria-expanded={open}
        style={{
          width: 26,
          height: 26,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 7,
          border: "none",
          background: open ? "#ffffff10" : "transparent",
          color: "var(--text-dim)",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <Icons.Settings />
      </button>
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 1099 }} onClick={() => setOpen(false)} />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              right: 0,
              zIndex: 1100,
              background: "var(--card-bg)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: 10,
              minWidth: 150,
              boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "var(--text-dim)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: 6,
              }}
            >
              {t("common.showOnChart")}
            </div>
            {options.map((opt) => (
              <label
                key={opt.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "5px 0",
                  fontSize: 13,
                  color: "var(--text)",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={!!value[opt.key]}
                  onChange={() => toggle(opt.key)}
                  style={{ accentColor: color }}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
