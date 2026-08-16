import { useState } from "react";
import { api } from "../../api";
import Modal, { FormField, FormInput, FormButton, FormError } from "../Modal";
import DeleteButton from "../DeleteButton";
import { colors } from "../../utils/colors";
import { logError } from "../../utils/errorLog";
import { useTranslation } from "../../locales";

function toLocalDate(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function BmiForm({ childId, entry, onDone, onClose }) {
  const t = useTranslation();
  const isEdit = !!entry;
  const [bmi, setBmi] = useState(entry?.bmi ? String(entry.bmi) : "");
  const [date, setDate] = useState(entry?.date ? toLocalDate(entry.date) : toLocalDate(new Date()));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bmi) return;
    setSaving(true);
    setError(null);
    try {
      const data = {
        bmi: parseFloat(bmi),
        date,
      };
      if (isEdit) {
        await api.updateBmi(entry.id, data);
      } else {
        data.child = childId;
        await api.createBmi(data);
      }
      onDone();
    } catch (err) {
      setSaving(false);
      setError(t("common.saveFailed"));
      logError(isEdit ? "Update BMI" : "Save BMI", err.message);
    }
  };

  const handleDelete = async () => {
    setError(null);
    try {
      await api.deleteBmi(entry.id);
      onDone();
    } catch (err) {
      setError(t("common.deleteFailed"));
      logError("Delete BMI", err.message);
    }
  };

  return (
    <Modal title={isEdit ? t("bmiForm.editTitle") : t("bmiForm.logTitle")} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormField label={t("bmiForm.amount")}>
          <FormInput
            type="number"
            value={bmi}
            onChange={(e) => setBmi(e.target.value)}
            placeholder="16.5"
            min="0"
            max="50"
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
        <FormButton color={colors.bmi} disabled={saving || !bmi}>
          {saving ? t("common.saving") : isEdit ? t("bmiForm.update") : t("bmiForm.save")}
        </FormButton>
      </form>
    </Modal>
  );
}
