import { useState } from "react";
import { api } from "../../api";
import Modal, { FormField, FormInput, FormButton } from "../Modal";
import { colors } from "../../utils/colors";

export default function TemperatureForm({ childId, onDone, onClose }) {
  const [temp, setTemp] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!temp) return;
    setSaving(true);
    try {
      await api.createTemperature({
        child: childId,
        temperature: parseFloat(temp),
      });
      onDone();
    } catch {
      setSaving(false);
    }
  };

  return (
    <Modal title="Log Temperature" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormField label="Temperature">
          <FormInput
            type="number"
            value={temp}
            onChange={(e) => setTemp(e.target.value)}
            placeholder="36.6"
            min="30"
            max="45"
            step="0.1"
            autoFocus
          />
        </FormField>
        <FormButton color={colors.temp} disabled={saving || !temp}>
          {saving ? "Saving..." : "Save Temperature"}
        </FormButton>
      </form>
    </Modal>
  );
}
