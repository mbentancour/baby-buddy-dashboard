import { useState } from "react";
import {
  ComposedChart,
  Line,
  Area,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import SectionCard from "./SectionCard";
import ChartDetailBar from "./ChartDetailBar";
import { toGrowthSeries, formatGrowthTick } from "../utils/formatters";
import { ageInWeeks, buildWhoBandSeries, toAgeWeekSeries, hasWhoStandard } from "../utils/growthStandards";
import { useTranslation } from "../locales";

function PercentileTooltip({ active, payload, label, color, unit }) {
  const t = useTranslation();
  if (!active || !payload?.length) return null;
  const band = payload.find((p) => p.dataKey === "p50")?.payload;
  const childPoint = payload.find((p) => p.dataKey === "value");
  return (
    <div
      style={{
        background: "var(--tooltip-bg)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: "8px 12px",
        fontSize: 12,
        color: "var(--text)",
        backdropFilter: "blur(8px)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{t("growth.weekOfAge", { week: Math.round(label) })}</div>
      {childPoint && (
        <div style={{ color, fontWeight: 600 }}>
          {t("growth.yourChild")}: {childPoint.value} {unit}
        </div>
      )}
      {band && (
        <div style={{ color: "var(--text-muted)", marginTop: 2 }}>
          P50: {band.p50} {unit} &nbsp;·&nbsp; P3–P97: {band.p3}–{band.p97} {unit}
        </div>
      )}
    </div>
  );
}

export default function GrowthTrendChart({
  title,
  icon,
  color,
  metric,
  entries,
  valueKey,
  unit,
  birthDate,
  childSex,
  onEditEntry,
}) {
  const t = useTranslation();
  const [showPercentiles, setShowPercentiles] = useState(false);
  const [selected, setSelected] = useState(null);

  const calendarSeries = toGrowthSeries(entries, valueKey);
  const canShowPercentiles = hasWhoStandard(metric, childSex) && !!birthDate;
  const active = showPercentiles && canShowPercentiles;

  const handleCalendarClick = (data) => {
    if (!data || !data.activePayload?.[0]) return;
    const payload = data.activePayload[0];
    setSelected({ label: payload.payload.timestamp, value: payload.value, entry: payload.payload.entry });
  };

  const handlePercentileClick = (data) => {
    if (!data || !data.activePayload?.length) return;
    const point = data.activePayload.find((p) => p.dataKey === "value");
    if (!point?.payload) return;
    setSelected({ label: point.payload.week, value: point.payload.value, entry: point.payload.entry, isWeek: true });
  };

  let whoBands = [];
  let childWeekSeries = [];
  if (active) {
    const nowWeek = ageInWeeks(birthDate, new Date());
    whoBands = buildWhoBandSeries(metric, childSex, nowWeek);
    childWeekSeries = toAgeWeekSeries(entries, valueKey, birthDate);
  }

  // Recharts' "auto" Y domain ignores an explicit min when a Line/Scatter shares the axis
  // with an Area, so compute it explicitly from the visible band + the child's own values.
  // Rounded to 2dp to avoid floating-point noise like "9.999999999" showing up as a tick label.
  let percentileYDomain = ["auto", "auto"];
  if (active && whoBands.length) {
    const lows = whoBands.map((b) => b.p3).concat(childWeekSeries.map((p) => p.value));
    const highs = whoBands.map((b) => b.p97).concat(childWeekSeries.map((p) => p.value));
    const min = Math.min(...lows);
    const max = Math.max(...highs);
    const pad = (max - min) * 0.08 || 1;
    percentileYDomain = [Math.round(Math.max(0, min - pad) * 100) / 100, Math.round((max + pad) * 100) / 100];
  }

  return (
    <SectionCard
      title={title}
      icon={icon}
      color={color}
      actions={
        canShowPercentiles ? (
          <button
            onClick={() => {
              setShowPercentiles((v) => !v);
              setSelected(null);
            }}
            style={{
              padding: "3px 10px",
              borderRadius: 12,
              border: active ? `1px solid ${color}60` : "1px solid var(--border)",
              background: active ? `${color}18` : "var(--bg)",
              color: active ? color : "var(--text-muted)",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              whiteSpace: "nowrap",
            }}
          >
            {t("growth.whoPercentiles")}
          </button>
        ) : null
      }
    >
      {active ? (
        whoBands.length >= 2 ? (
          <>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={whoBands} onClick={handlePercentileClick}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#252836" vertical={false} />
                  <XAxis
                    dataKey="week"
                    type="number"
                    domain={["dataMin", "dataMax"]}
                    tickFormatter={(w) => t("growth.weekShort", { week: Math.round(w) })}
                    tick={{ fontSize: 10, fill: "#5A6178" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#5A6178" }}
                    axisLine={false}
                    tickLine={false}
                    domain={percentileYDomain}
                    tickFormatter={(v) => Math.round(v * 10) / 10}
                  />
                  <Tooltip content={<PercentileTooltip color={color} unit={unit} />} />
                  <Area dataKey="outerRange" stroke="none" fill={color} fillOpacity={0.08} isAnimationActive={false} connectNulls />
                  <Area dataKey="innerRange" stroke="none" fill={color} fillOpacity={0.16} isAnimationActive={false} connectNulls />
                  <Line dataKey="p50" stroke={color} strokeOpacity={0.5} strokeWidth={1.5} strokeDasharray="4 3" dot={false} isAnimationActive={false} />
                  <Scatter
                    data={childWeekSeries}
                    dataKey="value"
                    fill={color}
                    line={{ stroke: color, strokeWidth: 2 }}
                    shape="circle"
                    isAnimationActive={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            {selected && (
              <ChartDetailBar
                label={t("growth.weekOfAge", { week: Math.round(selected.label) })}
                value={selected.value}
                unit={unit}
                color={color}
                actionLabel={t("common.edit")}
                onViewEntries={() => {
                  if (selected.entry) onEditEntry?.(metric, selected.entry);
                  setSelected(null);
                }}
                onDismiss={() => setSelected(null)}
              />
            )}
            <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 8, textAlign: "center" }}>
              {t("growth.whoSource")}
            </div>
          </>
        ) : (
          <div style={{ color: "var(--text-dim)", fontSize: 13, textAlign: "center", padding: 40 }}>
            {t("growth.needTwoMeasurements")}
          </div>
        )
      ) : calendarSeries.length >= 2 ? (
        <>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={calendarSeries} onClick={handleCalendarClick}>
                <CartesianGrid strokeDasharray="3 3" stroke="#252836" vertical={false} />
                <XAxis dataKey="timestamp" type="number" scale="time" domain={["dataMin", "dataMax"]} tickFormatter={formatGrowthTick} tick={{ fontSize: 11, fill: "#5A6178" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#5A6178" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                <Tooltip content={({ active: a, payload, label }) => {
                  if (!a || !payload?.length) return null;
                  return (
                    <div style={{ background: "var(--tooltip-bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 12px", fontSize: 12, color: "var(--text)", backdropFilter: "blur(8px)" }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{formatGrowthTick(label)}</div>
                      <div style={{ color }}>{payload[0].value} {unit}</div>
                    </div>
                  );
                }} />
                <Line
                  type="monotone"
                  dataKey={valueKey}
                  stroke={color}
                  strokeWidth={2.5}
                  dot={{ fill: color, r: 4, cursor: "pointer" }}
                  activeDot={{ r: 6, cursor: "pointer" }}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          {selected && !selected.isWeek && (
            <ChartDetailBar
              label={formatGrowthTick(selected.label)}
              value={selected.value}
              unit={unit}
              color={color}
              actionLabel={t("common.edit")}
              onViewEntries={() => {
                if (selected.entry) onEditEntry?.(metric, selected.entry);
                setSelected(null);
              }}
              onDismiss={() => setSelected(null)}
            />
          )}
        </>
      ) : (
        <div style={{ color: "var(--text-dim)", fontSize: 13, textAlign: "center", padding: 40 }}>
          {calendarSeries.length === 1 ? t("growth.needTwoMeasurements") : t(`growth.no${metric[0].toUpperCase()}${metric.slice(1)}Data`)}
        </div>
      )}
    </SectionCard>
  );
}
