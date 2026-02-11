import { useState } from "react";
import { api } from "../../api";
import Modal, { FormField, FormInput, FormButton } from "../Modal";
import { colors } from "../../utils/colors";

export default function TummyTimeForm({ childId, timerId, onDone, onClose }) {
  const [milestone, setMilestone] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { child: childId };
      if (timerId) data.timer = timerId;
      if (milestone.trim()) data.milestone = milestone.trim();
      await api.createTummyTime(data);
      onDone();
    } catch {
      setSaving(false);
    }
  };

  return (
    <Modal title="Log Tummy Time" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
          {timerId
            ? "The timer's start and end times will be used for this tummy time entry."
            : "A tummy time entry will be created with the current time."}
        </p>
        <FormField label="Milestone (optional)">
          <FormInput
            value={milestone}
            onChange={(e) => setMilestone(e.target.value)}
            placeholder="e.g., Lifted head"
          />
        </FormField>
        <FormButton color={colors.tummy} disabled={saving}>
          {saving ? "Saving..." : "Save Tummy Time"}
        </FormButton>
      </form>
    </Modal>
  );
}
