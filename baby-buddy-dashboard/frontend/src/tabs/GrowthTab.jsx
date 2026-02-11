import {
  LineChart,
  Line,
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
import { toGrowthSeries } from "../utils/formatters";

export default function GrowthTab({ weights, heights, temperatures }) {
  const weightSeries = toGrowthSeries(weights, "weight");
  const heightSeries = toGrowthSeries(heights, "height");
  const tempSeries = temperatures
    .slice()
    .sort((a, b) => new Date(a.time) - new Date(b.time))
    .map((t) => ({
      date: new Date(t.time).toLocaleDateString([], { month: "short", day: "numeric" }),
      temperature: parseFloat(t.temperature),
    }));

  const latestWeight = weights[0];
  const latestHeight = heights[0];
  const latestTemp = temperatures[0];

  return (
    <>
      {/* Latest Measurements */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
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
                  background: `${colors.temp}18`,
                  color: colors.temp,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icons.Temp />
              </div>
              <span style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                Temperature
              </span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
              {latestTemp ? `${latestTemp.temperature}°` : "—"}
            </div>
            {latestTemp && (
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                {new Date(latestTemp.time).toLocaleDateString()}
              </div>
            )}
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
        {/* Weight Chart */}
        <div className="fade-in fade-in-4">
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
        <div className="fade-in fade-in-5">
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

        {/* Temperature Chart */}
        <div className="fade-in fade-in-6">
          <SectionCard title="Temperature History" icon={<Icons.Temp />} color={colors.temp}>
            {tempSeries.length >= 2 ? (
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={tempSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#252836" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#5A6178" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#5A6178" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="temperature"
                      stroke={colors.temp}
                      strokeWidth={2.5}
                      dot={{ fill: colors.temp, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ color: "var(--text-dim)", fontSize: 13, textAlign: "center", padding: 40 }}>
                {tempSeries.length === 1 ? "Need at least 2 readings to show trend" : "No temperature data recorded yet"}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </>
  );
}
