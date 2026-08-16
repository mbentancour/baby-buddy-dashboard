import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import SectionCard from "./SectionCard";
import ChartDetailBar from "./ChartDetailBar";
import CustomTooltip from "./CustomTooltip";
import { Icons } from "./Icons";
import { colors } from "../utils/colors";
import { api } from "../api";
import { useUnits } from "../utils/units";
import { getMockData } from "../utils/mockData";
import { useTranslation, getLocale } from "../locales";

const RANGE_OPTIONS = [48, 72, 96];

function formatTick(ts) {
  return new Date(ts).toLocaleString(getLocale(), { weekday: "short", hour: "2-digit" });
}

function formatFull(ts) {
  return new Date(ts).toLocaleString(getLocale(), { weekday: "short", hour: "2-digit", minute: "2-digit" });
}

export default function TemperatureCard({ childId, demoMode, onEditEntry }) {
  const t = useTranslation();
  const units = useUnits();
  const [rangeHours, setRangeHours] = useState(72);
  const [loading, setLoading] = useState(!demoMode);
  const [error, setError] = useState(null);
  const [entries, setEntries] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const cutoff = Date.now() - rangeHours * 3600000;

    if (demoMode) {
      const mock = getMockData(childId);
      setEntries((mock.temperatures || []).filter((entry) => new Date(entry.time).getTime() >= cutoff));
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .getTemperature({ child: childId, limit: 200, ordering: "-time" })
      .then((res) => {
        if (cancelled) return;
        const results = (res.results || []).filter((entry) => new Date(entry.time).getTime() >= cutoff);
        setEntries(results);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [rangeHours, childId, demoMode]);

  const series = [...entries]
    .sort((a, b) => new Date(a.time) - new Date(b.time))
    .map((entry) => ({ timestamp: new Date(entry.time).getTime(), temperature: parseFloat(entry.temperature), entry }));

  const latest = entries[0];

  const handleChartClick = (data) => {
    if (!data || !data.activePayload?.[0]) return;
    const payload = data.activePayload[0];
    setSelected({ label: payload.payload.timestamp, value: payload.value, entry: payload.payload.entry });
  };

  return (
    <SectionCard title={t("temperature.title")} icon={<Icons.Temp />} color={colors.temp}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text)" }}>
          {latest ? `${latest.temperature} ${units.temp}` : "—"}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {RANGE_OPTIONS.map((h) => (
            <button
              key={h}
              onClick={() => setRangeHours(h)}
              style={{
                padding: "4px 10px",
                borderRadius: 14,
                border: rangeHours === h ? `1px solid ${colors.temp}60` : "1px solid var(--border)",
                background: rangeHours === h ? `${colors.temp}18` : "var(--bg)",
                color: rangeHours === h ? colors.temp : "var(--text-muted)",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {h}h
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ color: "var(--text-dim)", fontSize: 13, textAlign: "center", padding: 30 }}>
          {t("common.loading")}
        </div>
      ) : error ? (
        <div style={{ color: "#EF4444", fontSize: 13, textAlign: "center", padding: 30 }}>
          {t("common.failedToLoad", { error })}
        </div>
      ) : series.length >= 2 ? (
        <>
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} onClick={handleChartClick}>
                <CartesianGrid strokeDasharray="3 3" stroke="#252836" vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  type="number"
                  scale="time"
                  domain={["dataMin", "dataMax"]}
                  tickFormatter={formatTick}
                  tick={{ fontSize: 10, fill: "#5A6178" }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 11, fill: "#5A6178" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                <Tooltip content={<CustomTooltip labelFormatter={formatFull} />} />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke={colors.temp}
                  strokeWidth={2.5}
                  dot={{ fill: colors.temp, r: 3, cursor: "pointer" }}
                  activeDot={{ r: 5, cursor: "pointer" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {selected && (
            <ChartDetailBar
              label={formatFull(selected.label)}
              value={selected.value}
              unit={units.temp}
              color={colors.temp}
              actionLabel={t("common.edit")}
              onViewEntries={() => {
                if (selected.entry) onEditEntry?.("temp", selected.entry);
                setSelected(null);
              }}
              onDismiss={() => setSelected(null)}
            />
          )}
        </>
      ) : (
        <div style={{ color: "var(--text-dim)", fontSize: 13, textAlign: "center", padding: 30 }}>
          {series.length === 1 ? t("temperature.needTwoReadings") : t("temperature.noReadingsInRange", { hours: rangeHours })}
        </div>
      )}
    </SectionCard>
  );
}
