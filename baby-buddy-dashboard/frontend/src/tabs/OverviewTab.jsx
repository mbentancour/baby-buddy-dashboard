import {
  BarChart,
  Bar,
  AreaChart,
  Area,
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
import { Icons } from "../components/Icons";
import { colors } from "../utils/colors";
import {
  toFeedingTimeline,
  toDiaperTimeline,
  toSleepBlocks,
  aggregateByDayOfWeek,
  aggregateSleepByDay,
  aggregateTummyByDay,
  parseDuration,
} from "../utils/formatters";

export default function OverviewTab({ feedings, weeklyFeedings: weeklyFeedingsRaw, sleepEntries, weeklySleep, changes, tummyTimes, weeklyTummyTimes, onEditEntry }) {
  const feedingTimeline = toFeedingTimeline(feedings);
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
      ? tummyTimes.reduce((s, t) => s + parseDuration(t.duration) * 60, 0) /
        tummyTimes.length
      : 0;

  const wetCount = changes.filter((c) => c.wet && !c.solid).length;
  const solidCount = changes.filter((c) => c.solid && !c.wet).length;
  const bothCount = changes.filter((c) => c.wet && c.solid).length;

  return (
    <>
      {/* Quick Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <div className="fade-in fade-in-1">
          <StatCard
            icon={<Icons.Bottle />}
            label="Feedings"
            value={totalFeeding > 0 ? `${Math.round(totalFeeding)} mL` : `${feedings.length}`}
            sub={`${feedings.length} feeding${feedings.length !== 1 ? "s" : ""} today`}
            color={colors.feeding}
          />
        </div>
        <div className="fade-in fade-in-2">
          <StatCard
            icon={<Icons.Moon />}
            label="Sleep"
            value={`${totalSleep.toFixed(1)}h`}
            sub="Last 24 hours"
            color={colors.sleep}
          />
        </div>
        <div className="fade-in fade-in-3">
          <StatCard
            icon={<Icons.Droplet />}
            label="Diapers"
            value={totalDiapers}
            sub={`${wetCount} wet · ${solidCount} solid · ${bothCount} both`}
            color={colors.diaper}
          />
        </div>
        <div className="fade-in fade-in-4">
          <StatCard
            icon={<Icons.Sun />}
            label="Tummy Time"
            value={`${Math.round(avgTummy)}m`}
            sub={`${tummyTimes.length} session${tummyTimes.length !== 1 ? "s" : ""} today`}
            color={colors.tummy}
          />
        </div>
      </div>

      {/* Main Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 16,
        }}
      >
        {/* Feeding Timeline */}
        <div className="fade-in fade-in-3">
          <SectionCard title="Recent Feedings" icon={<Icons.Bottle />} color={colors.feeding}>
            {feedingTimeline.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {feedingTimeline.map((f, i) => (
                  <div key={i} className="entry-clickable" onClick={() => onEditEntry?.("feeding", f.entry)}>
                    <TimelineItem
                      time={f.time}
                      label={f.label}
                      detail={f.detail}
                      color={colors.feeding}
                      isLast={i === feedingTimeline.length - 1}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: "var(--text-dim)", fontSize: 13, textAlign: "center", padding: 20 }}>
                No feedings recorded today
              </div>
            )}
            {weeklyFeedings.some((d) => d.amount > 0) && (
              <div style={{ marginTop: 16, height: 120 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyFeedings} barSize={18}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#252836" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#5A6178" }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="amount" fill={colors.feeding} radius={[6, 6, 0, 0]} opacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>
        </div>

        {/* Sleep */}
        <div className="fade-in fade-in-4">
          <SectionCard title="Sleep Pattern" icon={<Icons.Moon />} color={colors.sleep}>
            {sleepBlocks.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {sleepBlocks.map((s, i) => (
                  <div key={i} className="entry-clickable" onClick={() => onEditEntry?.("sleep", s.entry)}>
                    <TimelineItem
                      time={`${s.start}–${s.end}`}
                      label={`${s.duration.toFixed(1)}h${s.nap ? " · Nap" : ""}`}
                      detail={`${s.start} to ${s.end}`}
                      color={colors.sleep}
                      isLast={i === sleepBlocks.length - 1}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: "var(--text-dim)", fontSize: 13, textAlign: "center", padding: 20 }}>
                No sleep recorded
              </div>
            )}
            {sleepByDay.some((d) => d.hours > 0) && (
              <div style={{ marginTop: 16, height: 120 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sleepByDay} barSize={18}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#252836" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#5A6178" }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="hours" fill={colors.sleep} radius={[6, 6, 0, 0]} opacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>
        </div>

        {/* Diapers */}
        <div className="fade-in fade-in-5">
          <SectionCard title="Diaper Changes" icon={<Icons.Droplet />} color={colors.diaper}>
            {diaperTimeline.length > 0 ? (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {diaperTimeline.map((d, i) => (
                    <div
                      key={i}
                      className="entry-clickable"
                      onClick={() => onEditEntry?.("diaper", d.entry)}
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
                    <div style={{ fontSize: 11, color: "var(--text-dim)" }}>Wet</div>
                  </div>
                  <div style={{ width: 1, background: "var(--border)" }} />
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#D97706" }}>{solidCount}</div>
                    <div style={{ fontSize: 11, color: "var(--text-dim)" }}>Solid</div>
                  </div>
                  <div style={{ width: 1, background: "var(--border)" }} />
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text)" }}>{totalDiapers}</div>
                    <div style={{ fontSize: 11, color: "var(--text-dim)" }}>Total</div>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ color: "var(--text-dim)", fontSize: 13, textAlign: "center", padding: 20 }}>
                No diaper changes recorded today
              </div>
            )}
          </SectionCard>
        </div>

        {/* Tummy Time */}
        <div className="fade-in fade-in-6">
          <SectionCard title="Tummy Time" icon={<Icons.Sun />} color={colors.tummy}>
            {tummyByDay.some((d) => d.minutes > 0) ? (
              <>
                <div style={{ height: 140 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tummyByDay} barSize={22}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#252836" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#5A6178" }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="minutes" fill={colors.tummy} radius={[6, 6, 0, 0]} opacity={0.8} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
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
                    Avg{" "}
                    <strong style={{ color: colors.tummy }}>{Math.round(avgTummy)} min</strong>{" "}
                    per session
                  </span>
                </div>
              </>
            ) : (
              <div style={{ color: "var(--text-dim)", fontSize: 13, textAlign: "center", padding: 20 }}>
                No tummy time recorded today
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </>
  );
}
