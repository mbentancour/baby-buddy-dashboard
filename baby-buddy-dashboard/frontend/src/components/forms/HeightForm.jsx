import { useState, useContext } from "react";
import { api } from "../../api";
import Modal, { FormField, FormInput, FormButton, FormError } from "../Modal";
import DeleteButton from "../DeleteButton";
import { colors } from "../../utils/colors";
import { useUnits, UnitContext } from "../../utils/units";
import { logError } from "../../utils/errorLog";
import { useTranslation } from "../../locales";
import { syncBmiForDate } from "../../utils/bmiSync";

function toLocalDate(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function HeightForm({ childId, entry, onDone, onClose, weights = [], bmis = [] }) {
  const t = useTranslation();
  const units = useUnits();
  const unitSystem = useContext(UnitContext);
  const isEdit = !!entry;
  const [height, setHeight] = useState(entry?.height ? String(entry.height) : "");
  const [date, setDate] = useState(entry?.date ? toLocalDate(entry.date) : toLocalDate(new Date()));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!height) return;
    setSaving(true);
    setError(null);
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

      const matchingWeight = weights.find((w) => w.date === date);
      if (matchingWeight) {
        try {
          await syncBmiForDate({
            childId,
            date,
            weightValue: parseFloat(matchingWeight.weight),
            heightValue: data.height,
            bmis,
            unitSystem,
          });
        } catch (bmiErr) {
          logError("Auto-calculate BMI", bmiErr.message);
        }
      }

      onDone();
    } catch (err) {
      setSaving(false);
      setError(t("common.saveFailed"));
      logError(isEdit ? "Update Height" : "Save Height", err.message);
    }
  };

  const handleDelete = async () => {
    setError(null);
    try {
      await api.deleteHeight(entry.id);
      onDone();
    } catch (err) {
      setError(t("common.deleteFailed"));
      logError("Delete Height", err.message);
    }
  };

  return (
    <Modal title={isEdit ? t("heightForm.editTitle") : t("heightForm.logTitle")} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormField label={t("heightForm.amount", { unit: units.length })}>
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
        <FormButton color={colors.height} disabled={saving || !height}>
          {saving ? t("common.saving") : isEdit ? t("heightForm.update") : t("heightForm.save")}
        </FormButton>
      </form>
    </Modal>
  );
}
