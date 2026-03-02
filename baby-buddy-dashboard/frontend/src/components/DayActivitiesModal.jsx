import Modal from "./Modal";
import TimelineItem from "./TimelineItem";
import DiaperBadge from "./DiaperBadge";
import { Icons } from "./Icons";
import { colors } from "../utils/colors";
import {
  toFeedingTimeline,
  toSleepBlocks,
  toDiaperTimeline,
  parseDuration,
} from "../utils/formatters";
import { useUnits } from "../utils/units";

export default function DayActivitiesModal({ day, type, data, onEditEntry, onClose }) {
  const units = useUnits();

  const getIcon = () => {
    switch (type) {
      case "feeding": return <Icons.Bottle />;
      case "sleep": return <Icons.Moon />;
      case "tummy": return <Icons.Sun />;
      default: return <Icons.Activity />;
    }
  };

  const getColor = () => {
    switch (type) {
      case "feeding": return colors.feeding;
      case "sleep": return colors.sleep;
      case "tummy": return colors.tummy;
      default: return colors.diaper;
    }
  };

  const getTitle = () => {
    const titles = {
      feeding: "Feedings",
      sleep: "Sleep Sessions",
      tummy: "Tummy Time",
    };
    return `${titles[type] || "Activities"} - ${day}`;
  };

  const renderContent = () => {
    if (!data || data.length === 0) {
      return (
        <div style={{ color: "var(--text-dim)", fontSize: 13, textAlign: "center", padding: 40 }}>
          No {type} activities for this day
        </div>
      );
    }

    if (type === "feeding") {
      const timeline = toFeedingTimeline(data, units.volume);
      return (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {timeline.map((f, i, arr) => (
            <div
              key={i}
              className="entry-clickable"
              onClick={() => {
                onEditEntry?.("feeding", f.entry);
                onClose();
              }}
            >
              <TimelineItem
                time={f.time}
                label={f.label}
                detail={f.detail}
                color={colors.feeding}
                isLast={i === arr.length - 1}
              />
            </div>
          ))}
        </div>
      );
    }

    if (type === "sleep") {
      const blocks = toSleepBlocks(data);
      return (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {blocks.map((s, i, arr) => (
            <div
              key={i}
              className="entry-clickable"
              onClick={() => {
                onEditEntry?.("sleep", s.entry);
                onClose();
              }}
            >
              <TimelineItem
                time={`${s.start}–${s.end}`}
                label={`${s.duration.toFixed(1)}h${s.nap ? " · Nap" : ""}`}
                detail={`${s.start} to ${s.end}`}
                color={colors.sleep}
                isLast={i === arr.length - 1}
              />
            </div>
          ))}
        </div>
      );
    }

    if (type === "tummy") {
      return (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {data.map((t, i, arr) => (
            <div
              key={i}
              className="entry-clickable"
              onClick={() => {
                onEditEntry?.("tummy", t);
                onClose();
              }}
            >
              <TimelineItem
                time={new Date(t.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                label={`${Math.round(parseDuration(t.duration) * 60)} min${t.milestone ? ` · ${t.milestone}` : ""}`}
                detail={`${new Date(t.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} to ${new Date(t.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                color={colors.tummy}
                isLast={i === arr.length - 1}
              />
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <Modal title={getTitle()} onClose={onClose}>
      <div style={{ padding: "0 4px" }}>
        {renderContent()}
      </div>
    </Modal>
  );
}
