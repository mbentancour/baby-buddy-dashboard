import { useState } from "react";
import { api } from "../../api";
import Modal, { FormField, FormInput, FormButton } from "../Modal";
import { colors } from "../../utils/colors";

export default function HeightForm({ childId, onDone, onClose }) {
  const [height, setHeight] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!height) return;
    setSaving(true);
    try {
      await api.createHeight({
        child: childId,
        height: parseFloat(height),
      });
      onDone();
    } catch {
      setSaving(false);
    }
  };

  return (
    <Modal title="Log Height" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormField label="Height (cm)">
          <FormInput
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="50.0"
            min="0"
            max="200"
            step="0.1"
            autoFocus
          />
        </FormField>
        <FormButton color={colors.height} disabled={saving || !height}>
          {saving ? "Saving..." : "Save Height"}
        </FormButton>
      </form>
    </Modal>
  );
}
