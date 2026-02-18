import { useState } from "react";
import { api } from "../../api";
import Modal, { FormField, FormSelect, FormInput, FormButton } from "../Modal";
import { colors } from "../../utils/colors";

function toLocalDatetime(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const COLORS = [
  { value: "", label: "Not specified" },
  { value: "black", label: "Black" },
  { value: "brown", label: "Brown" },
  { value: "green", label: "Green" },
  { value: "yellow", label: "Yellow" },
];

export default function DiaperForm({ childId, entry, onDone, onClose, preset }) {
  const isEdit = !!entry;
  const [time, setTime] = useState(entry?.time ? toLocalDatetime(new Date(entry.time)) : toLocalDatetime(new Date()));
  const [wet, setWet] = useState(entry ? entry.wet : (preset === "wet" || preset === "both"));
  const [solid, setSolid] = useState(entry ? entry.solid : (preset === "solid" || preset === "both"));
  const [color, setColor] = useState(entry?.color || "");
  const [notes, setNotes] = useState(entry?.notes || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { wet, solid, time: `${time}:00` };
      if (color) data.color = color;
      if (notes.trim()) data.notes = notes.trim();
      if (isEdit) {
        await api.updateChange(entry.id, data);
      } else {
        data.child = childId;
        await api.createChange(data);
      }
      onDone();
    } catch {
      setSaving(false);
    }
  };

  return (
    <Modal title={isEdit ? "Edit Diaper Change" : "Log Diaper Change"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormField label="Time">
          <FormInput
            type="datetime-local"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </FormField>
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          {[
            { key: "wet", label: "Wet", active: wet, toggle: () => setWet(!wet) },
            { key: "solid", label: "Solid", active: solid, toggle: () => setSolid(!solid) },
          ].map((btn) => (
            <button
              key={btn.key}
              type="button"
              onClick={btn.toggle}
              style={{
                flex: 1,
                padding: "10px 16px",
                borderRadius: 10,
                border: btn.active ? `2px solid ${colors.diaper}` : "1px solid var(--border)",
                background: btn.active ? `${colors.diaper}15` : "var(--bg)",
                color: btn.active ? colors.diaper : "var(--text-muted)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
        {solid && (
          <FormField label="Color">
            <FormSelect options={COLORS} value={color} onChange={(e) => setColor(e.target.value)} />
          </FormField>
        )}
        <FormField label="Notes">
          <FormInput
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional"
          />
        </FormField>
        <FormButton color={colors.diaper} disabled={saving || (!wet && !solid)}>
          {saving ? "Saving..." : isEdit ? "Update Change" : "Save Change"}
        </FormButton>
      </form>
    </Modal>
  );
}
