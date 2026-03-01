import { useState } from "react";
import SectionCard from "../components/SectionCard";
import TimelineItem from "../components/TimelineItem";
import { Icons } from "../components/Icons";
import { colors } from "../utils/colors";
import { toNoteTimeline } from "../utils/formatters";

const COLLAPSED_COUNT = 5;

export default function NotesTab({ notes, onEditEntry }) {
  const [expanded, setExpanded] = useState(false);
  const noteTimeline = toNoteTimeline(notes || []);

  return (
    <div className="fade-in fade-in-1">
      <SectionCard title="Notes" icon={<Icons.StickyNote />} color={colors.note}>
        {noteTimeline.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {(expanded ? noteTimeline : noteTimeline.slice(0, COLLAPSED_COUNT)).map((n, i, arr) => (
              <div
                key={i}
                className="entry-clickable"
                onClick={() => onEditEntry?.("note", n.entry)}
              >
                <TimelineItem
                  time={n.time}
                  label={n.text}
                  detail={n.ago}
                  color={colors.note}
                  isLast={i === arr.length - 1}
                />
              </div>
            ))}
            {noteTimeline.length > COLLAPSED_COUNT && (
              <button
                className="expand-toggle"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? "Show less" : `Show ${noteTimeline.length - COLLAPSED_COUNT} more`}
              </button>
            )}
          </div>
        ) : (
          <div style={{ color: "var(--text-dim)", fontSize: 13, textAlign: "center", padding: 40 }}>
            No notes yet — tap + to add one
          </div>
        )}
      </SectionCard>
    </div>
  );
}
