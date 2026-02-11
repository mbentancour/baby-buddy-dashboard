import { useState } from "react";
import { api } from "../../api";
import Modal, { FormField, FormInput, FormButton } from "../Modal";
import { colors } from "../../utils/colors";

function toLocalDatetime(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function SleepForm({ childId, timerId, onDone, onClose }) {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const [start, setStart] = useState(toLocalDatetime(oneHourAgo));
  const [end, setEnd] = useState(toLocalDatetime(now));
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { child: childId };
      if (timerId) {
        data.timer = timerId;
      } else {
        data.start = `${start}:00`;
        data.end = `${end}:00`;
      }
      await api.createSleep(data);
      onDone();
    } catch {
      setSaving(false);
    }
  };

  return (
    <Modal title="Log Sleep" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {timerId ? (
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
            The timer's start and end times will be used for this sleep entry.
          </p>
        ) : (
          <>
            <FormField label="Start">
              <FormInput
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                required
              />
            </FormField>
            <FormField label="End">
              <FormInput
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                required
              />
            </FormField>
          </>
        )}
        <FormButton color={colors.sleep} disabled={saving}>
          {saving ? "Saving..." : "Save Sleep"}
        </FormButton>
      </form>
    </Modal>
  );
}
