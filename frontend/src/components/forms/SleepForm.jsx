import { useState } from "react";
import { api } from "../../api";
import Modal, { FormButton } from "../Modal";
import { colors } from "../../utils/colors";

export default function SleepForm({ childId, timerId, onDone, onClose }) {
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { child: childId };
      if (timerId) data.timer = timerId;
      await api.createSleep(data);
      onDone();
    } catch {
      setSaving(false);
    }
  };

  return (
    <Modal title="Log Sleep" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
          {timerId
            ? "The timer's start and end times will be used for this sleep entry."
            : "A sleep entry will be created with the current time."}
        </p>
        <FormButton color={colors.sleep} disabled={saving}>
          {saving ? "Saving..." : "Save Sleep"}
        </FormButton>
      </form>
    </Modal>
  );
}
