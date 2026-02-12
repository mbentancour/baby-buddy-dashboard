import { useState } from "react";
import { api } from "../../api";
import Modal, { FormField, FormInput, FormButton } from "../Modal";
import { colors } from "../../utils/colors";

export default function WeightForm({ childId, onDone, onClose }) {
  const [weight, setWeight] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!weight) return;
    setSaving(true);
    try {
      await api.createWeight({
        child: childId,
        weight: parseFloat(weight),
      });
      onDone();
    } catch {
      setSaving(false);
    }
  };

  return (
    <Modal title="Log Weight" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormField label="Weight (kg)">
          <FormInput
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="5.0"
            min="0"
            max="30"
            step="0.01"
            autoFocus
          />
        </FormField>
        <FormButton color={colors.growth} disabled={saving || !weight}>
          {saving ? "Saving..." : "Save Weight"}
        </FormButton>
      </form>
    </Modal>
  );
}
