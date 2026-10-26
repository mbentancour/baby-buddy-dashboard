import { useState } from "react";
import { api } from "../../api";
import Modal, { FormField, FormInput, FormButton, FormError } from "../Modal";
import DateTimeInput from "../DateTimeInput";
import DeleteButton from "../DeleteButton";
import { colors } from "../../utils/colors";
import { useUnits } from "../../utils/units";
import { logError } from "../../utils/errorLog";
import { useTranslation } from "../../locales";
import { toApiDatetime } from "../../utils/formatters";

function toLocalDatetime(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function PumpingForm({ childId, timerId, entry, onDone, onClose }) {
  const t = useTranslation();
  const units = useUnits();
  const isEdit = !!entry;
  const now = new Date();
  const twentyMinsAgo = new Date(now.getTime() - 20 * 60 * 1000);
  const [amount, setAmount] = useState(entry?.amount != null ? String(entry.amount) : "");
  const [start, setStart] = useState(entry?.start ? toLocalDatetime(new Date(entry.start)) : toLocalDatetime(twentyMinsAgo));
  const [end, setEnd] = useState(entry?.end ? toLocalDatetime(new Date(entry.end)) : toLocalDatetime(now));
  const [notes, setNotes] = useState(entry?.notes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const data = { amount: parseFloat(amount) };
      if (notes.trim()) data.notes = notes.trim();
      if (isEdit) {
        data.start = toApiDatetime(start);
        data.end = toApiDatetime(end);
        await api.updatePumping(entry.id, data);
      } else {
        data.child = childId;
        if (timerId) {
          data.timer = timerId;
        } else {
          data.start = toApiDatetime(start);
          data.end = toApiDatetime(end);
        }
        await api.createPumping(data);
      }
      onDone();
    } catch (err) {
      setSaving(false);
      setError(err.message || t("common.saveFailed"));
      logError(isEdit ? "Update Pumping" : "Save Pumping", err.message);
    }
  };

  const handleDelete = async () => {
    setError(null);
    try {
      await api.deletePumping(entry.id);
      onDone();
    } catch (err) {
      setError(err.message || t("common.deleteFailed"));
      logError("Delete Pumping", err.message);
    }
  };

  return (
    <Modal title={isEdit ? t("pumpingForm.editTitle") : t("pumpingForm.logTitle")} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {!isEdit && timerId ? (
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
            {t("form.timerNote", { type: t("action.pumping").toLowerCase() })}
          </p>
        ) : (
          <>
            <FormField label={t("common.start")}>
              <DateTimeInput value={start} onChange={setStart} required />
            </FormField>
            <FormField label={t("common.end")}>
              <DateTimeInput value={end} onChange={setEnd} required />
            </FormField>
          </>
        )}
        <FormField label={t("pumpingForm.amount", { unit: units.volume })}>
          <FormInput
            type="number"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            min="0.1"
            step="any"
            required
          />
        </FormField>
        <FormField label={t("common.notes")}>
          <FormInput
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={t("common.optional")}
          />
        </FormField>
        <FormError message={error} />
        {isEdit && <DeleteButton onDelete={handleDelete} disabled={saving} />}
        <FormButton color={colors.pumping} disabled={saving}>
          {saving ? t("common.saving") : isEdit ? t("pumpingForm.update") : t("pumpingForm.save")}
        </FormButton>
      </form>
    </Modal>
  );
}
