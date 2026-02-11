import { useState } from "react";
import { api } from "../../api";
import Modal, { FormField, FormSelect, FormButton } from "../Modal";
import { colors } from "../../utils/colors";

const COLORS = [
  { value: "", label: "Not specified" },
  { value: "black", label: "Black" },
  { value: "brown", label: "Brown" },
  { value: "green", label: "Green" },
  { value: "yellow", label: "Yellow" },
];

export default function DiaperForm({ childId, onDone, onClose, preset }) {
  const [wet, setWet] = useState(preset === "wet" || preset === "both");
  const [solid, setSolid] = useState(preset === "solid" || preset === "both");
  const [color, setColor] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { child: childId, wet, solid };
      if (color) data.color = color;
      await api.createChange(data);
      onDone();
    } catch {
      setSaving(false);
    }
  };

  return (
    <Modal title="Log Diaper Change" onClose={onClose}>
      <form onSubmit={handleSubmit}>
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
        <FormButton color={colors.diaper} disabled={saving || (!wet && !solid)}>
          {saving ? "Saving..." : "Save Change"}
        </FormButton>
      </form>
    </Modal>
  );
}
