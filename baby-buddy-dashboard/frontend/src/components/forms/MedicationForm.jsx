import { useState } from "react";
import { api } from "../../api";
import Modal, { FormField, FormSelect, FormInput, FormButton, FormError } from "../Modal";
import DeleteButton from "../DeleteButton";
import { colors } from "../../utils/colors";
import { logError } from "../../utils/errorLog";
import { useTranslation } from "../../locales";
import { toApiDatetime } from "../../utils/formatters";

function toLocalDatetime(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseNextDoseHours(interval) {
  if (!interval) return "";
  const parts = String(interval).trim().split(" ");
  const days = parts.length > 1 ? parseFloat(parts[0]) || 0 : 0;
  const hms = (parts.length > 1 ? parts[1] : parts[0]).split(":").map(Number);
  const hours = days * 24 + (hms[0] || 0) + (hms[1] || 0) / 60;
  return hours ? String(hours) : "";
}

export default function MedicationForm({ childId, entry, onDone, onClose }) {
  const t = useTranslation();
  const isEdit = !!entry;

  const DOSAGE_UNITS = [
    { value: "", label: t("form.notSpecified") },
    { value: "mg", label: t("medicationForm.dosageUnits.mg") },
    { value: "ml", label: t("medicationForm.dosageUnits.ml") },
    { value: "tablets", label: t("medicationForm.dosageUnits.tablets") },
    { value: "drops", label: t("medicationForm.dosageUnits.drops") },
  ];

  const [name, setName] = useState(entry?.name || "");
  const [dosage, setDosage] = useState(entry?.dosage != null ? String(entry.dosage) : "");
  const [dosageUnit, setDosageUnit] = useState(entry?.dosage_unit || "");
  const [time, setTime] = useState(entry?.time ? toLocalDatetime(new Date(entry.time)) : toLocalDatetime(new Date()));
  const [nextDoseHours, setNextDoseHours] = useState(parseNextDoseHours(entry?.next_dose_interval));
  const [notes, setNotes] = useState(entry?.notes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const data = { name: name.trim(), time: toApiDatetime(time) };
      if (dosage) data.dosage = parseFloat(dosage);
      if (dosageUnit) data.dosage_unit = dosageUnit;
      if (nextDoseHours) data.next_dose_interval = `${nextDoseHours}:00:00`;
      if (notes.trim()) data.notes = notes.trim();
      if (isEdit) {
        await api.updateMedication(entry.id, data);
      } else {
        data.child = childId;
        await api.createMedication(data);
      }
      onDone();
    } catch (err) {
      setSaving(false);
      setError(t("common.saveFailed"));
      logError(isEdit ? "Update Medication" : "Save Medication", err.message);
    }
  };

  const handleDelete = async () => {
    setError(null);
    try {
      await api.deleteMedication(entry.id);
      onDone();
    } catch (err) {
      setError(t("common.deleteFailed"));
      logError("Delete Medication", err.message);
    }
  };

  return (
    <Modal title={isEdit ? t("medicationForm.editTitle") : t("medicationForm.logTitle")} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormField label={t("form.medication")}>
          <FormInput
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("form.medicationPlaceholder")}
            autoFocus
            required
          />
        </FormField>
        <FormField label={t("form.dosage")}>
          <FormInput
            type="number"
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            placeholder={t("common.optional")}
            min="0"
            step="0.1"
          />
        </FormField>
        <FormField label={t("form.dosageUnit")}>
          <FormSelect options={DOSAGE_UNITS} value={dosageUnit} onChange={(e) => setDosageUnit(e.target.value)} />
        </FormField>
        <FormField label={t("form.timeGiven")}>
          <FormInput
            type="datetime-local"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </FormField>
        <FormField label={t("form.nextDoseInHours")}>
          <FormInput
            type="number"
            value={nextDoseHours}
            onChange={(e) => setNextDoseHours(e.target.value)}
            placeholder={t("form.nextDosePlaceholder")}
            min="0"
            step="0.5"
          />
        </FormField>
        <FormField label={t("common.notes")}>
          <FormInput
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("common.optional")}
          />
        </FormField>
        <FormError message={error} />
        {isEdit && <DeleteButton onDelete={handleDelete} disabled={saving} />}
        <FormButton color={colors.medication} disabled={saving || !name.trim()}>
          {saving ? t("common.saving") : isEdit ? t("medicationForm.update") : t("medicationForm.save")}
        </FormButton>
      </form>
    </Modal>
  );
}
