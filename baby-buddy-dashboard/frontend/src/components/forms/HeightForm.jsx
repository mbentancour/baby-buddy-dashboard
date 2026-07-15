import { useState } from "react";
import { api } from "../../api";
import Modal, { FormField, FormInput, FormButton } from "../Modal";
import { colors } from "../../utils/colors";
import { useUnits } from "../../utils/units";
import { t } from "../../locales";

function toLocalDate(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function HeightForm({ childId, entry, onDone, onClose }) {
  const units = useUnits();
  const isEdit = !!entry;
  const [height, setHeight] = useState(entry?.height ? String(entry.height) : "");
  const [date, setDate] = useState(entry?.date ? toLocalDate(entry.date) : toLocalDate(new Date()));
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!height) return;
    setSaving(true);
    try {
      const data = {
        height: parseFloat(height),
        date,
      };
      if (isEdit) {
        await api.updateHeight(entry.id, data);
      } else {
        data.child = childId;
        await api.createHeight(data);
      }
      onDone();
    } catch {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={isEdit ? t("heightForm.editTitle") : t("heightForm.logTitle")}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <FormField label={t("heightForm.label", { unit: units.length })}>
          <FormInput
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="50.0"
            min="0"
            max="200"
            step="0.1"
            autoFocus
            required
          />
        </FormField>
        <FormField label={t("form.date")}>
          <FormInput
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </FormField>
        <FormButton color={colors.height} disabled={saving || !height}>
          {saving ? t("form.saving") : isEdit ? t("heightForm.update") : t("heightForm.save")}
        </FormButton>
      </form>
    </Modal>
  );
}