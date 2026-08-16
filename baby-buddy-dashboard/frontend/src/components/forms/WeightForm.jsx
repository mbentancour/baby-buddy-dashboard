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

export default function WeightForm({ childId, entry, onDone, onClose, heights = [], bmis = [] }) {
  const t = useTranslation();
  const units = useUnits();
  const unitSystem = useContext(UnitContext);
  const isEdit = !!entry;
  const [weight, setWeight] = useState(entry?.weight ? String(entry.weight) : "");
  const [date, setDate] = useState(entry?.date ? toLocalDate(entry.date) : toLocalDate(new Date()));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!weight) return;
    setSaving(true);
    setError(null);
    try {
      const data = {
        weight: parseFloat(weight),
        date,
      };
      if (isEdit) {
        await api.updateWeight(entry.id, data);
      } else {
        data.child = childId;
        await api.createWeight(data);
      }

      const matchingHeight = heights.find((h) => h.date === date);
      if (matchingHeight) {
        try {
          await syncBmiForDate({
            childId,
            date,
            weightValue: data.weight,
            heightValue: parseFloat(matchingHeight.height),
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
      logError(isEdit ? "Update Weight" : "Save Weight", err.message);
    }
  };

  const handleDelete = async () => {
    setError(null);
    try {
      await api.deleteWeight(entry.id);
      onDone();
    } catch (err) {
      setError(t("common.deleteFailed"));
      logError("Delete Weight", err.message);
    }
  };

  return (
    <Modal title={isEdit ? t("weightForm.editTitle") : t("weightForm.logTitle")} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormField label={t("weightForm.amount", { unit: units.weight })}>
          <FormInput
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="5.0"
            min="0"
            max="30"
            step="0.01"
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
        <FormButton color={colors.growth} disabled={saving || !weight}>
          {saving ? t("common.saving") : isEdit ? t("weightForm.update") : t("weightForm.save")}
        </FormButton>
      </form>
    </Modal>
  );
}
