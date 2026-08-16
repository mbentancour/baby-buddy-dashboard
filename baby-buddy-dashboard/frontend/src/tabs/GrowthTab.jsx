import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import SectionCard from "../components/SectionCard";
import CustomTooltip from "../components/CustomTooltip";
import ChartDetailBar from "../components/ChartDetailBar";
import DayActivitiesModal from "../components/DayActivitiesModal";
import ReportModal from "../components/ReportModal";
import MeasurementsReportModal from "../components/MeasurementsReportModal";
import ChartSettingsMenu from "../components/ChartSettingsMenu";
import GrowthTrendChart from "../components/GrowthTrendChart";
import { Icons } from "../components/Icons";
import { colors } from "../utils/colors";
import { useUnits } from "../utils/units";
import { dailyFeedingTotals, dailySleepTotals, dailyDiaperTotals, getEntriesForDate, averageFeedingGapMs, averageBreastFeedingDurationMs, formatElapsedHM } from "../utils/formatters";
import { clickableProps } from "../utils/a11y";
import { useFeedingChartMetrics } from "../hooks/useFeedingChartMetrics";
import { useTranslation, getLocale } from "../locales";

export default function GrowthTab({ childId, demoMode, birthDate, childSex, weights, heights, headCircumferences, bmis, monthlyFeedings, monthlySleep, monthlyChanges, onEditEntry }) {
  const t = useTranslation();
  const units = useUnits();
  const [dayModal, setDayModal] = useState(null);
  const [selectedBar, setSelectedBar] = useState(null);
  const [showGrowthReport, setShowGrowthReport] = useState(false);
  const [showMeasureReport, setShowMeasureReport] = useState(false);
  const [feedingMetrics, updateFeedingMetrics] = useFeedingChartMetrics();
  const feedingSeries = dailyFeedingTotals(monthlyFeedings);
  const sleepSeries = dailySleepTotals(monthlySleep);
  const diaperSeries = dailyDiaperTotals(monthlyChanges || []);

  const FEEDING_METRIC_OPTIONS = [
    { key: "amount", label: t("feedingForm.amount", { unit: units.volume }) },
    { key: "count", label: t("overview.feedings") },
  ];

  const latestWeight = weights[0];
  const latestHeight = heights[0];
  const latestHeadCircumference = headCircumferences[0];
  const latestBmi = bmis[0];

  // Compute averages for stat cards
  const feedingDays = feedingSeries.filter((d) => d.amount > 0);
  const avgFeeding = feedingDays.length
    ? Math.round(feedingDays.reduce((s, d) => s + d.amount, 0) / feedingDays.length)
    : 0;
  const feedCountDays = feedingSeries.filter((d) => d.count > 0);
  const avgFeedCount = feedCountDays.length
    ? Math.round(feedCountDays.reduce((s, d) => s + d.count, 0) / feedCountDays.length)
    : 0;
  const avgFeedingGapMs = averageFeedingGapMs(monthlyFeedings);
  const avgBreastDurationMs = averageBreastFeedingDurationMs(monthlyFeedings);
  const sleepDays = sleepSeries.filter((d) => d.hours > 0);
  const avgSleep = sleepDays.length
    ? (sleepDays.reduce((s, d) => s + d.hours, 0) / sleepDays.length).toFixed(1)
    : 0;
  const diaperDays = diaperSeries.filter((d) => d.count > 0);
  const avgDiapers = diaperDays.length
    ? Math.round(diaperDays.reduce((s, d) => s + d.count, 0) / diaperDays.length)
    : 0;

  const handleChartClick = (data, type) => {
    if (!data || !data.activePayload?.[0]) return;
    const label = data.activeLabel;
    if (type === "feeding") {
      const amount = data.activePayload?.find((p) => p.dataKey === "amount")?.value;
      const count = data.activePayload?.find((p) => p.dataKey === "count")?.value;
      setSelectedBar({ type, label, value: amount, value2: count });
      return;
    }
    const payload = data.activePayload[0];
    const value = payload.value;
    const entry = payload.payload?.entry;
    setSelectedBar({ type, label, value, entry });
  };

  const openDayModal = (dateLabel, type) => {
    let dayData = [];
    if (type === "feeding") {
      dayData = getEntriesForDate(monthlyFeedings, dateLabel, "start");
    } else if (type === "sleep") {
      dayData = getEntriesForDate(monthlySleep, dateLabel, "start");
    }
    setSelectedBar(null);
    setDayModal({ day: dateLabel, type, data: dayData });
  };

  return (
    <>
      {/* Latest Measurements */}
      <div className="stats-grid">
        <div className="fade-in fade-in-1">
          <div
            className="entry-clickable"
            {...clickableProps(() => setShowMeasureReport(true))}
            style={{
              background: "var(--card-bg)",
              borderRadius: 16,
              padding: "20px 22px",
              border: "1px solid var(--border)",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: `${colors.growth}18`,
                  color: colors.growth,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icons.Weight />
              </div>
              <span style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                {t("growth.weight")}
              </span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
              {latestWeight ? `${latestWeight.weight} ${units.weight}` : "—"}
            </div>
            {latestWeight && (
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                {new Date(latestWeight.date).toLocaleDateString(getLocale())}
              </div>
            )}
          </div>
        </div>

        <div className="fade-in fade-in-2">
          <div
            className="entry-clickable"
            {...clickableProps(() => setShowMeasureReport(true))}
            style={{
              background: "var(--card-bg)",
              borderRadius: 16,
              padding: "20px 22px",
              border: "1px solid var(--border)",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: `${colors.height}18`,
                  color: colors.height,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icons.Ruler />
              </div>
              <span style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                {t("growth.height")}
              </span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
              {latestHeight ? `${latestHeight.height} ${units.length}` : "—"}
            </div>
            {latestHeight && (
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                {new Date(latestHeight.date).toLocaleDateString(getLocale())}
              </div>
            )}
          </div>
        </div>

        <div className="fade-in fade-in-3">
          <div
            className="entry-clickable"
            {...clickableProps(() => setShowMeasureReport(true))}
            style={{
              background: "var(--card-bg)",
              borderRadius: 16,
              padding: "20px 22px",
              border: "1px solid var(--border)",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: `${colors.headCircumference}18`,
                  color: colors.headCircumference,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icons.HeadCircle />
              </div>
              <span style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                {t("growth.headCircumference")}
              </span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
              {latestHeadCircumference ? `${latestHeadCircumference.head_circumference} ${units.length}` : "—"}
            </div>
            {latestHeadCircumference && (
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                {new Date(latestHeadCircumference.date).toLocaleDateString(getLocale())}
              </div>
            )}
          </div>
        </div>

        <div className="fade-in fade-in-3">
          <div
            className="entry-clickable"
            {...clickableProps(() => setShowMeasureReport(true))}
            style={{
              background: "var(--card-bg)",
              borderRadius: 16,
              padding: "20px 22px",
              border: "1px solid var(--border)",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: `${colors.bmi}18`,
                  color: colors.bmi,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icons.Gauge />
              </div>
              <span style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                {t("growth.bmi")}
              </span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
              {latestBmi ? latestBmi.bmi : "—"}
            </div>
            {latestBmi && (
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                {new Date(latestBmi.date).toLocaleDateString(getLocale())}
              </div>
            )}
          </div>
        </div>

        <div className="fade-in fade-in-3">
          <div
            className="entry-clickable"
            {...clickableProps(() => setShowGrowthReport(true))}
            style={{
              background: "var(--card-bg)",
              borderRadius: 16,
              padding: "20px 22px",
              border: "1px solid var(--border)",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: `${colors.feeding}18`,
                  color: colors.feeding,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icons.Bottle />
              </div>
              <span style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                {t("growth.avgFeeding")}
              </span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
              {avgFeeding ? `${avgFeeding} ${units.volume}` : "—"}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
              {avgFeedCount ? t("growth.feedingsPerDay30d", { count: avgFeedCount }) : t("growth.perDay30d")}
            </div>
            {avgFeedingGapMs && (
              <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>
                {t("growth.avgGap", { gap: formatElapsedHM(avgFeedingGapMs) })}
              </div>
            )}
            {avgBreastDurationMs && (
              <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>
                {t("growth.avgBreastDuration", { duration: formatElapsedHM(avgBreastDurationMs) })}
              </div>
            )}
          </div>
        </div>

        <div className="fade-in fade-in-4">
          <div
            className="entry-clickable"
            {...clickableProps(() => setShowGrowthReport(true))}
            style={{
              background: "var(--card-bg)",
              borderRadius: 16,
              padding: "20px 22px",
              border: "1px solid var(--border)",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: `${colors.diaper}18`,
                  color: colors.diaper,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icons.Droplet />
              </div>
              <span style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                {t("growth.avgDiapers")}
              </span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
              {avgDiapers || "—"}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
              {t("growth.perDay30d")}
            </div>
          </div>
        </div>

        <div className="fade-in fade-in-4">
          <div
            className="entry-clickable"
            {...clickableProps(() => setShowGrowthReport(true))}
            style={{
              background: "var(--card-bg)",
              borderRadius: 16,
              padding: "20px 22px",
              border: "1px solid var(--border)",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: `${colors.sleep}18`,
                  color: colors.sleep,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icons.Moon />
              </div>
              <span style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                {t("growth.avgSleep")}
              </span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
              {avgSleep ? `${avgSleep} h` : "—"}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
              {t("growth.perDay30d")}
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="card-grid">
        {/* Daily Feeding Totals */}
        <div className="fade-in fade-in-5">
          <SectionCard
            title={t("growth.dailyFeeding30d")}
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
            {feedingSeries.some((d) => d.amount > 0 || d.count > 0) ? (
              <>
                <div style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={feedingSeries} onClick={(data) => handleChartClick(data, "feeding")}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#252836" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#5A6178" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                      <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#5A6178" }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="right" orientation="right" hide />
                      <Tooltip content={<CustomTooltip />} />
                      {feedingMetrics.amount && (
                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="amount"
                          stroke={colors.feeding}
                          strokeWidth={2}
                          fill={`${colors.feeding}30`}
                          dot={false}
                          activeDot={{ r: 4, fill: colors.feeding, cursor: "pointer" }}
                          cursor="pointer"
                        />
                      )}
                      {feedingMetrics.count && (
                        <Area
                          yAxisId="right"
                          type="monotone"
                          dataKey="count"
                          stroke={`${colors.feeding}99`}
                          strokeWidth={2}
                          strokeDasharray="4 3"
                          fill="transparent"
                          dot={false}
                          activeDot={{ r: 4, fill: colors.feeding, cursor: "pointer" }}
                          cursor="pointer"
                        />
                      )}
                    </AreaChart>
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
            ) : (
              <div style={{ color: "var(--text-dim)", fontSize: 13, textAlign: "center", padding: 40 }}>
                {t("growth.noFeedingData")}
              </div>
            )}
            <button
              onClick={() => setShowGrowthReport(true)}
              style={{
                display: "block",
                width: "100%",
                marginTop: 12,
                padding: "6px 0",
                background: "none",
                border: "none",
                color: "var(--text-dim)",
                fontSize: 12,
                fontWeight: 500,
                fontFamily: "inherit",
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              {t("common.report")}
            </button>
          </SectionCard>
        </div>

        {/* Daily Sleep Totals */}
        <div className="fade-in fade-in-6">
          <SectionCard title={t("growth.dailySleep30d")} icon={<Icons.Moon />} color={colors.sleep}>
            {sleepSeries.some((d) => d.hours > 0) ? (
              <>
                <div style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sleepSeries} onClick={(data) => handleChartClick(data, "sleep")}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#252836" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#5A6178" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 11, fill: "#5A6178" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="hours"
                        stroke={colors.sleep}
                        strokeWidth={2}
                        fill={`${colors.sleep}30`}
                        dot={false}
                        activeDot={{ r: 4, fill: colors.sleep, cursor: "pointer" }}
                        cursor="pointer"
                      />
                    </AreaChart>
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
            ) : (
              <div style={{ color: "var(--text-dim)", fontSize: 13, textAlign: "center", padding: 40 }}>
                {t("growth.noSleepData")}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Weight Chart */}
        <div className="fade-in fade-in-7">
          <GrowthTrendChart
            title={t("growth.weightTrend")}
            icon={<Icons.Weight />}
            color={colors.growth}
            metric="weight"
            entries={weights}
            valueKey="weight"
            unit={units.weight}
            birthDate={birthDate}
            childSex={childSex}
            onEditEntry={onEditEntry}
          />
        </div>

        {/* Height Chart */}
        <div className="fade-in fade-in-8">
          <GrowthTrendChart
            title={t("growth.heightTrend")}
            icon={<Icons.Ruler />}
            color={colors.height}
            metric="height"
            entries={heights}
            valueKey="height"
            unit={units.length}
            birthDate={birthDate}
            childSex={childSex}
            onEditEntry={onEditEntry}
          />
        </div>

        {/* Head Circumference Chart */}
        <div className="fade-in fade-in-8">
          <GrowthTrendChart
            title={t("growth.headCircumferenceTrend")}
            icon={<Icons.HeadCircle />}
            color={colors.headCircumference}
            metric="headCircumference"
            entries={headCircumferences}
            valueKey="head_circumference"
            unit={units.length}
            birthDate={birthDate}
            childSex={childSex}
            onEditEntry={onEditEntry}
          />
        </div>

        {/* BMI Chart */}
        <div className="fade-in fade-in-8">
          <GrowthTrendChart
            title={t("growth.bmiTrend")}
            icon={<Icons.Gauge />}
            color={colors.bmi}
            metric="bmi"
            entries={bmis}
            valueKey="bmi"
            unit=""
            birthDate={birthDate}
            childSex={childSex}
            onEditEntry={onEditEntry}
          />
        </div>
      </div>

      {dayModal && (
        <DayActivitiesModal
          day={dayModal.day}
          type={dayModal.type}
          data={dayModal.data}
          onEditEntry={onEditEntry}
          onClose={() => setDayModal(null)}
        />
      )}
      {showGrowthReport && <ReportModal childId={childId} demoMode={demoMode} onClose={() => setShowGrowthReport(false)} />}
      {showMeasureReport && (
        <MeasurementsReportModal
          weights={weights}
          heights={heights}
          headCircumferences={headCircumferences}
          bmis={bmis}
          onClose={() => setShowMeasureReport(false)}
        />
      )}
    </>
  );
}
