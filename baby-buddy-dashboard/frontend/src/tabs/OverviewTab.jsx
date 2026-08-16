import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import StatCard from "../components/StatCard";
import SectionCard from "../components/SectionCard";
import TimelineItem from "../components/TimelineItem";
import DiaperBadge from "../components/DiaperBadge";
import CustomTooltip from "../components/CustomTooltip";
import ChartDetailBar from "../components/ChartDetailBar";
import DayActivitiesModal from "../components/DayActivitiesModal";
import ChartSettingsMenu from "../components/ChartSettingsMenu";
import ReportModal from "../components/ReportModal";
import { Icons } from "../components/Icons";
import { colors } from "../utils/colors";
import {
  toFeedingTimeline,
  toDiaperTimeline,
  toSleepBlocks,
  aggregateByDayOfWeek,
  aggregateSleepByDay,
  aggregateTummyByDay,
  getEntriesForDay,
  parseDuration,
} from "../utils/formatters";
import { useUnits } from "../utils/units";
import { clickableProps } from "../utils/a11y";
import { useFeedingChartMetrics } from "../hooks/useFeedingChartMetrics";
import { useTranslation } from "../locales";

const COLLAPSED_COUNT = 2;

export default function OverviewTab({ childId, demoMode, feedings, weeklyFeedings: weeklyFeedingsRaw, sleepEntries, weeklySleep, changes, tummyTimes, weeklyTummyTimes, onEditEntry }) {
  const t = useTranslation();
  const units = useUnits();
  const [expanded, setExpanded] = useState({});
  const [dayModal, setDayModal] = useState(null);
  const [selectedBar, setSelectedBar] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [feedingMetrics, updateFeedingMetrics] = useFeedingChartMetrics();
  const toggle = (key) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const FEEDING_METRIC_OPTIONS = [
    { key: "amount", label: t("feedingForm.amount", { unit: units.volume }) },
    { key: "count", label: t("overview.feedings") },
  ];

  const feedingTimeline = toFeedingTimeline(feedings, units.volume);
  const diaperTimeline = toDiaperTimeline(changes);
  const sleepBlocks = toSleepBlocks(sleepEntries);
  const weeklyFeedings = aggregateByDayOfWeek(weeklyFeedingsRaw, "amount");
  const sleepByDay = aggregateSleepByDay(weeklySleep);
  const tummyByDay = aggregateTummyByDay(weeklyTummyTimes);

  const totalFeeding = feedings.reduce((s, f) => s + (f.amount || 0), 0);
  const totalSleep = sleepEntries.reduce(
    (s, e) => s + parseDuration(e.duration),
    0
  );
  const totalDiapers = changes.length;
  const avgTummy =
    tummyTimes.length > 0
      ? tummyTimes.reduce((s, tt) => s + parseDuration(tt.duration) * 60, 0) /
        tummyTimes.length
      : 0;

  const wetCount = changes.filter((c) => c.wet && !c.solid).length;
  const solidCount = changes.filter((c) => c.solid && !c.wet).length;
  const bothCount = changes.filter((c) => c.wet && c.solid).length;

  const handleChartClick = (data, type) => {
    if (!data || !data.activeLabel) return;
    const label = data.activeLabel;
    if (type === "feeding") {
      const amount = data.activePayload?.find((p) => p.dataKey === "amount")?.value;
      const count = data.activePayload?.find((p) => p.dataKey === "count")?.value;
      setSelectedBar({ type, label, value: amount, value2: count });
      return;
    }
    const value = data.activePayload?.[0]?.value;
    setSelectedBar({ type, label, value });
  };

  const openDayModal = (day, type) => {
    let dayData = [];
    if (type === "feeding") {
      dayData = getEntriesForDay(weeklyFeedingsRaw, day, "start");
    } else if (type === "sleep") {
      dayData = getEntriesForDay(weeklySleep, day, "start");
    } else if (type === "tummy") {
      dayData = getEntriesForDay(weeklyTummyTimes, day, "start");
    }
    setSelectedBar(null);
    setDayModal({ day, type, data: dayData });
  };

  return (
    <>
      {/* Quick Stats */}
      <div className="stats-grid">
        <div className="fade-in fade-in-1">
          <StatCard
            icon={<Icons.Bottle />}
            label={t("overview.feedings")}
            value={totalFeeding > 0 ? t("overview.today", { value: `${Math.round(totalFeeding)} ${units.volume}` }) : t("overview.today", { value: feedings.length })}
            sub={feedingTimeline[0] ? t("overview.lastSync", { time: feedingTimeline[0].detail }) : undefined}
            color={colors.feeding}
            onClick={() => setShowReport(true)}
          />
        </div>
        <div className="fade-in fade-in-2">
          <StatCard
            icon={<Icons.Moon />}
            label={t("overview.sleep")}
            value={`${totalSleep.toFixed(1)}h`}
            sub={t("overview.last24Hours")}
            color={colors.sleep}
            onClick={() => setShowReport(true)}
          />
        </div>
        <div className="fade-in fade-in-3">
          <StatCard
            icon={<Icons.Droplet />}
            label={t("overview.diapers")}
            value={totalDiapers}
            sub={t("overview.wetSolidBoth", { wet: wetCount, solid: solidCount, both: bothCount })}
            color={colors.diaper}
            onClick={() => setShowReport(true)}
          />
        </div>
        <div className="fade-in fade-in-4">
          <StatCard
            icon={<Icons.Sun />}
            label={t("overview.tummyTime")}
            value={`${Math.round(avgTummy)}m`}
            sub={t(tummyTimes.length === 1 ? "overview.sessionToday" : "overview.sessionsToday", { count: tummyTimes.length })}
            color={colors.tummy}
            onClick={() => setShowReport(true)}
          />
        </div>
      </div>

      {/* Main Grid */}
      <div className="card-grid">
        {/* Feeding Timeline */}
        <div className="fade-in fade-in-3">
          <SectionCard
            title={t("overview.recentFeedings")}
            icon={<Icons.Bottle />}
            color={colors.feeding}
            actions={
              <ChartSettingsMenu
                options={FEEDING_METRIC_OPTIONS}
                value={feedingMetrics}
                onChange={updateFeedingMetrics}
                color={colors.feeding}
              />
            }
          >
            {feedingTimeline.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {(expanded.feedings ? feedingTimeline : feedingTimeline.slice(0, COLLAPSED_COUNT)).map((f, i, arr) => (
                  <div key={i} className="entry-clickable" {...clickableProps(() => onEditEntry?.("feeding", f.entry))}>
                    <TimelineItem
                      time={f.time}
                      label={f.label}
                      detail={f.detail}
                      color={colors.feeding}
                      isLast={i === arr.length - 1}
                    />
                  </div>
                ))}
                {feedingTimeline.length > COLLAPSED_COUNT && (
                  <button className="expand-toggle" onClick={() => toggle("feedings")}>
                    {expanded.feedings ? t("common.showLess") : t("common.showMore", { count: feedingTimeline.length - COLLAPSED_COUNT })}
                  </button>
                )}
              </div>
            ) : (
              <div style={{ color: "var(--text-dim)", fontSize: 13, textAlign: "center", padding: 20 }}>
                {t("overview.noFeedingsToday")}
              </div>
            )}
            {weeklyFeedings.some((d) => d.amount > 0 || d.count > 0) && (
              <>
                {feedingMetrics.amount && feedingMetrics.count && (
                  <div style={{ display: "flex", gap: 14, marginTop: 16, fontSize: 11, color: "var(--text-muted)" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ width: 7, height: 7, borderRadius: 2, background: colors.feeding, display: "inline-block" }} />
                      {units.volume}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ width: 7, height: 7, borderRadius: 2, background: `${colors.feeding}55`, display: "inline-block" }} />
                      {t("overview.feedingsLegend")}
                    </span>
                  </div>
                )}
                <div style={{ marginTop: 8, height: 120 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyFeedings} barSize={14} barGap={4} onClick={(data) => handleChartClick(data, "feeding")}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#252836" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#5A6178" }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="left" hide />
                      <YAxis yAxisId="right" hide orientation="right" />
                      <Tooltip content={<CustomTooltip />} />
                      {feedingMetrics.amount && (
                        <Bar yAxisId="left" dataKey="amount" fill={colors.feeding} radius={[6, 6, 0, 0]} opacity={0.85} cursor="pointer" />
                      )}
                      {feedingMetrics.count && (
                        <Bar yAxisId="right" dataKey="count" fill={colors.feeding} radius={[6, 6, 0, 0]} opacity={0.35} cursor="pointer" />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {selectedBar?.type === "feeding" && (
                  <ChartDetailBar
                    label={selectedBar.label}
                    value={selectedBar.value}
                    unit={units.volume}
                    value2={selectedBar.value2}
                    unit2={t("chartMetric.count")}
                    color={colors.feeding}
                    onViewEntries={() => openDayModal(selectedBar.label, "feeding")}
                    onDismiss={() => setSelectedBar(null)}
                  />
                )}
              </>
            )}
          </SectionCard>
        </div>

        {/* Sleep */}
        <div className="fade-in fade-in-4">
          <SectionCard title={t("overview.sleepPattern")} icon={<Icons.Moon />} color={colors.sleep}>
            {sleepBlocks.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {(expanded.sleep ? sleepBlocks : sleepBlocks.slice(0, COLLAPSED_COUNT)).map((s, i, arr) => (
                  <div key={i} className="entry-clickable" {...clickableProps(() => onEditEntry?.("sleep", s.entry))}>
                    <TimelineItem
                      time={`${s.start}–${s.end}`}
                      label={`${s.duration.toFixed(1)}h${s.nap ? ` · ${t("common.nap")}` : ""}`}
                      detail={`${s.start} ${t("common.to")} ${s.end}`}
                      color={colors.sleep}
                      isLast={i === arr.length - 1}
                    />
                  </div>
                ))}
                {sleepBlocks.length > COLLAPSED_COUNT && (
                  <button className="expand-toggle" onClick={() => toggle("sleep")}>
                    {expanded.sleep ? t("common.showLess") : t("common.showMore", { count: sleepBlocks.length - COLLAPSED_COUNT })}
                  </button>
                )}
              </div>
            ) : (
              <div style={{ color: "var(--text-dim)", fontSize: 13, textAlign: "center", padding: 20 }}>
                {t("overview.noSleepRecorded")}
              </div>
            )}
            {sleepByDay.some((d) => d.hours > 0) && (
              <>
                <div style={{ marginTop: 16, height: 120 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sleepByDay} barSize={18} onClick={(data) => handleChartClick(data, "sleep")}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#252836" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#5A6178" }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="hours" fill={colors.sleep} radius={[6, 6, 0, 0]} opacity={0.85} cursor="pointer" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {selectedBar?.type === "sleep" && (
                  <ChartDetailBar
                    label={selectedBar.label}
                    value={selectedBar.value}
                    unit="h"
                    color={colors.sleep}
                    onViewEntries={() => openDayModal(selectedBar.label, "sleep")}
                    onDismiss={() => setSelectedBar(null)}
                  />
                )}
              </>
            )}
          </SectionCard>
        </div>

        {/* Diapers */}
        <div className="fade-in fade-in-5">
          <SectionCard title={t("overview.diaperChanges")} icon={<Icons.Droplet />} color={colors.diaper}>
            {diaperTimeline.length > 0 ? (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {(expanded.diapers ? diaperTimeline : diaperTimeline.slice(0, COLLAPSED_COUNT)).map((d, i) => (
                    <div
                      key={i}
                      className="entry-clickable"
                      {...clickableProps(() => onEditEntry?.("diaper", d.entry))}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        borderRadius: 10,
                        background: i === 0 ? `${colors.diaper}08` : "transparent",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <DiaperBadge type={d.type} />
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{d.time}</span>
                      </div>
                      <span style={{ fontSize: 11, color: "var(--text-dim)", fontFamily: "var(--mono)" }}>
                        {d.ago}
                      </span>
                    </div>
                  ))}
                  {diaperTimeline.length > COLLAPSED_COUNT && (
                    <button className="expand-toggle" onClick={() => toggle("diapers")}>
                      {expanded.diapers ? t("common.showLess") : t("common.showMore", { count: diaperTimeline.length - COLLAPSED_COUNT })}
                    </button>
                  )}
                </div>
                <div
                  style={{
                    marginTop: 16,
                    display: "flex",
                    gap: 12,
                    padding: "12px 16px",
                    borderRadius: 12,
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#3B82F6" }}>{wetCount}</div>
                    <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{t("diaper.wet")}</div>
                  </div>
                  <div style={{ width: 1, background: "var(--border)" }} />
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#D97706" }}>{solidCount}</div>
                    <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{t("diaper.solid")}</div>
                  </div>
                  <div style={{ width: 1, background: "var(--border)" }} />
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text)" }}>{totalDiapers}</div>
                    <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{t("common.total")}</div>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ color: "var(--text-dim)", fontSize: 13, textAlign: "center", padding: 20 }}>
                {t("overview.noDiaperChangesToday")}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Tummy Time */}
        <div className="fade-in fade-in-6">
          <SectionCard title={t("overview.tummyTimeTitle")} icon={<Icons.Sun />} color={colors.tummy}>
            {tummyByDay.some((d) => d.minutes > 0) ? (
              <>
                <div style={{ height: 140 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tummyByDay} barSize={22} onClick={(data) => handleChartClick(data, "tummy")}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#252836" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#5A6178" }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="minutes" fill={colors.tummy} radius={[6, 6, 0, 0]} opacity={0.8} cursor="pointer" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {selectedBar?.type === "tummy" ? (
                  <ChartDetailBar
                    label={selectedBar.label}
                    value={selectedBar.value}
                    unit={t("common.min")}
                    color={colors.tummy}
                    onViewEntries={() => openDayModal(selectedBar.label, "tummy")}
                    onDismiss={() => setSelectedBar(null)}
                  />
                ) : (
                  <div
                    style={{
                      marginTop: 12,
                      display: "flex",
                      gap: 12,
                      alignItems: "center",
                      padding: "10px 14px",
                      borderRadius: 10,
                      background: `${colors.tummy}08`,
                      border: `1px solid ${colors.tummy}15`,
                    }}
                  >
                    <Icons.TrendUp />
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {t("common.avg")}{" "}
                      <strong style={{ color: colors.tummy }}>{Math.round(avgTummy)} {t("common.min")}</strong>{" "}
                      {t("overview.perSession")}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div style={{ color: "var(--text-dim)", fontSize: 13, textAlign: "center", padding: 20 }}>
                {t("overview.noTummyTimeToday")}
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      {/* Day Activities Modal */}
      {dayModal && (
        <DayActivitiesModal
          day={dayModal.day}
          type={dayModal.type}
          data={dayModal.data}
          onEditEntry={onEditEntry}
          onClose={() => setDayModal(null)}
        />
      )}
      {showReport && <ReportModal childId={childId} demoMode={demoMode} onClose={() => setShowReport(false)} />}
    </>
  );
}
