import {
  LineChart,
  Line,
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
import { Icons } from "../components/Icons";
import { colors } from "../utils/colors";
import { toGrowthSeries, dailyFeedingTotals, dailySleepTotals } from "../utils/formatters";

export default function GrowthTab({ weights, heights, monthlyFeedings, monthlySleep }) {
  const weightSeries = toGrowthSeries(weights, "weight");
  const heightSeries = toGrowthSeries(heights, "height");
  const feedingSeries = dailyFeedingTotals(monthlyFeedings);
  const sleepSeries = dailySleepTotals(monthlySleep);

  const latestWeight = weights[0];
  const latestHeight = heights[0];

  // Compute averages for stat cards
  const feedingDays = feedingSeries.filter((d) => d.amount > 0);
  const avgFeeding = feedingDays.length
    ? Math.round(feedingDays.reduce((s, d) => s + d.amount, 0) / feedingDays.length)
    : 0;
  const sleepDays = sleepSeries.filter((d) => d.hours > 0);
  const avgSleep = sleepDays.length
    ? (sleepDays.reduce((s, d) => s + d.hours, 0) / sleepDays.length).toFixed(1)
    : 0;

  return (
    <>
      {/* Latest Measurements */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <div className="fade-in fade-in-1">
          <div
            style={{
              background: "var(--card-bg)",
              borderRadius: 16,
              padding: "20px 22px",
              border: "1px solid var(--border)",
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
                Weight
              </span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
              {latestWeight ? `${latestWeight.weight} kg` : "—"}
            </div>
            {latestWeight && (
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                {new Date(latestWeight.date).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        <div className="fade-in fade-in-2">
          <div
            style={{
              background: "var(--card-bg)",
              borderRadius: 16,
              padding: "20px 22px",
              border: "1px solid var(--border)",
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
                Height
              </span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
              {latestHeight ? `${latestHeight.height} cm` : "—"}
            </div>
            {latestHeight && (
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                {new Date(latestHeight.date).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        <div className="fade-in fade-in-3">
          <div
            style={{
              background: "var(--card-bg)",
              borderRadius: 16,
              padding: "20px 22px",
              border: "1px solid var(--border)",
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
                Avg Feeding
              </span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
              {avgFeeding ? `${avgFeeding} mL` : "—"}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
              per day (30d)
            </div>
          </div>
        </div>

        <div className="fade-in fade-in-4">
          <div
            style={{
              background: "var(--card-bg)",
              borderRadius: 16,
              padding: "20px 22px",
              border: "1px solid var(--border)",
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
                Avg Sleep
              </span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
              {avgSleep ? `${avgSleep} h` : "—"}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
              per day (30d)
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 16,
        }}
      >
        {/* Daily Feeding Totals */}
        <div className="fade-in fade-in-5">
          <SectionCard title="Daily Feeding (30d)" icon={<Icons.Bottle />} color={colors.feeding}>
            {feedingSeries.some((d) => d.amount > 0) ? (
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={feedingSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#252836" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#5A6178" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11, fill: "#5A6178" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke={colors.feeding}
                      strokeWidth={2}
                      fill={`${colors.feeding}30`}
                      dot={false}
                      activeDot={{ r: 4, fill: colors.feeding }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ color: "var(--text-dim)", fontSize: 13, textAlign: "center", padding: 40 }}>
                No feeding data recorded yet
              </div>
            )}
          </SectionCard>
        </div>

        {/* Daily Sleep Totals */}
        <div className="fade-in fade-in-6">
          <SectionCard title="Daily Sleep (30d)" icon={<Icons.Moon />} color={colors.sleep}>
            {sleepSeries.some((d) => d.hours > 0) ? (
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sleepSeries}>
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
                      activeDot={{ r: 4, fill: colors.sleep }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ color: "var(--text-dim)", fontSize: 13, textAlign: "center", padding: 40 }}>
                No sleep data recorded yet
              </div>
            )}
          </SectionCard>
        </div>

        {/* Weight Chart */}
        <div className="fade-in fade-in-7">
          <SectionCard title="Weight Trend" icon={<Icons.Weight />} color={colors.growth}>
            {weightSeries.length >= 2 ? (
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#252836" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#5A6178" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#5A6178" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke={colors.growth}
                      strokeWidth={2.5}
                      dot={{ fill: colors.growth, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ color: "var(--text-dim)", fontSize: 13, textAlign: "center", padding: 40 }}>
                {weightSeries.length === 1 ? "Need at least 2 measurements to show trend" : "No weight data recorded yet"}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Height Chart */}
        <div className="fade-in fade-in-8">
          <SectionCard title="Height Trend" icon={<Icons.Ruler />} color={colors.height}>
            {heightSeries.length >= 2 ? (
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={heightSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#252836" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#5A6178" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#5A6178" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="height"
                      stroke={colors.height}
                      strokeWidth={2.5}
                      dot={{ fill: colors.height, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ color: "var(--text-dim)", fontSize: 13, textAlign: "center", padding: 40 }}>
                {heightSeries.length === 1 ? "Need at least 2 measurements to show trend" : "No height data recorded yet"}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </>
  );
}
