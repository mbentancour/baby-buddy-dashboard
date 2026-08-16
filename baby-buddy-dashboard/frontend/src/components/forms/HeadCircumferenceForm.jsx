import { useState } from "react";
import { api } from "../../api";
import Modal, { FormField, FormInput, FormButton, FormError } from "../Modal";
import DeleteButton from "../DeleteButton";
import { colors } from "../../utils/colors";
import { useUnits } from "../../utils/units";
import { logError } from "../../utils/errorLog";
import { useTranslation } from "../../locales";

function toLocalDate(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function HeadCircumferenceForm({ childId, entry, onDone, onClose }) {
  const t = useTranslation();
  const units = useUnits();
  const isEdit = !!entry;
  const [headCircumference, setHeadCircumference] = useState(
    entry?.head_circumference ? String(entry.head_circumference) : ""
  );
  const [date, setDate] = useState(entry?.date ? toLocalDate(entry.date) : toLocalDate(new Date()));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!headCircumference) return;
    setSaving(true);
    setError(null);
    try {
      const data = {
        head_circumference: parseFloat(headCircumference),
        date,
      };
      if (isEdit) {
        await api.updateHeadCircumference(entry.id, data);
      } else {
        data.child = childId;
        await api.createHeadCircumference(data);
      }
      onDone();
    } catch (err) {
      setSaving(false);
      setError(t("common.saveFailed"));
      logError(isEdit ? "Update Head Circumference" : "Save Head Circumference", err.message);
    }
  };

  const handleDelete = async () => {
    setError(null);
    try {
      await api.deleteHeadCircumference(entry.id);
      onDone();
    } catch (err) {
      setError(t("common.deleteFailed"));
      logError("Delete Head Circumference", err.message);
    }
  };

  return (
    <Modal title={isEdit ? t("headCircumferenceForm.editTitle") : t("headCircumferenceForm.logTitle")} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormField label={t("headCircumferenceForm.amount", { unit: units.length })}>
          <FormInput
            type="number"
            value={headCircumference}
            onChange={(e) => setHeadCircumference(e.target.value)}
            placeholder="35.0"
            min="0"
            max="70"
            step="0.1"
            autoFocus
            required
          />
        </FormField>
        <FormField label={t("common.date")}>
          <FormInput
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </FormField>
        <FormError message={error} />
        {isEdit && <DeleteButton onDelete={handleDelete} disabled={saving} />}
        <FormButton color={colors.headCircumference} disabled={saving || !headCircumference}>
          {saving ? t("common.saving") : isEdit ? t("headCircumferenceForm.update") : t("headCircumferenceForm.save")}
        </FormButton>
      </form>
    </Modal>
  );
}
