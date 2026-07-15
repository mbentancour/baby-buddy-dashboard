import { useState } from "react";
import { api } from "../../api";
import Modal, { FormField, FormSelect, FormInput, FormButton } from "../Modal";
import { colors } from "../../utils/colors";
import { useUnits } from "../../utils/units";
import { t } from "../../locales";

const TYPES = [
  { value: "breast milk", label: t("feedingForm.types.breastMilk") },
  { value: "formula", label: t("feedingForm.types.formula") },
  { value: "fortified breast milk", label: t("feedingForm.types.fortifiedBreastMilk") },
  { value: "solid food", label: t("feedingForm.types.solidFood") },
];

const METHODS = [
  { value: "bottle", label: t("feedingForm.methods.bottle") },
  { value: "left breast", label: t("feedingForm.methods.leftBreast") },
  { value: "right breast", label: t("feedingForm.methods.rightBreast") },
  { value: "both breasts", label: t("feedingForm.methods.bothBreasts") },
  { value: "parent fed", label: t("feedingForm.methods.parentFed") },
  { value: "self fed", label: t("feedingForm.methods.selfFed") },
];

function toLocalDatetime(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function FeedingForm({ childId, timerId, entry, onDone, onClose }) {
  const units = useUnits();
  const isEdit = !!entry;
  const now = new Date();
  const fifteenMinsAgo = new Date(now.getTime() - 15 * 60 * 1000);
  const [type, setType] = useState(entry?.type || "breast milk");
  const [method, setMethod] = useState(entry?.method || "bottle");
  const [amount, setAmount] = useState(entry?.amount != null ? String(entry.amount) : "");
  const [start, setStart] = useState(entry?.start ? toLocalDatetime(new Date(entry.start)) : toLocalDatetime(fifteenMinsAgo));
  const [end, setEnd] = useState(entry?.end ? toLocalDatetime(new Date(entry.end)) : toLocalDatetime(now));
  const [notes, setNotes] = useState(entry?.notes || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { type, method };
      if (amount) data.amount = parseFloat(amount);
      if (notes.trim()) data.notes = notes.trim();
      if (isEdit) {
        data.start = `${start}:00`;
        data.end = `${end}:00`;
        await api.updateFeeding(entry.id, data);
      } else {
        data.child = childId;
        if (timerId) {
          data.timer = timerId;
        } else {
          data.start = `${start}:00`;
          data.end = `${end}:00`;
        }
        await api.createFeeding(data);
      }
      onDone();
    } catch {
      setSaving(false);
    }
  };

  return (
    <Modal title={isEdit ? t("feedingForm.editTitle") : t("feedingForm.logTitle")} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormField label={t("feedingForm.type")}>
          <FormSelect options={TYPES} value={type} onChange={(e) => setType(e.target.value)} />
        </FormField>
        <FormField label={t("feedingForm.method")}>
          <FormSelect options={METHODS} value={method} onChange={(e) => setMethod(e.target.value)} />
        </FormField>
        <FormField label={t("feedingForm.amount", { unit: units.volume })}>
          <FormInput type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={t("form.optional")} min="0" step="5" />
        </FormField>
        {(isEdit || !timerId) && (
          <>
            <FormField label={t("form.start")}>
              <FormInput
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                required
              />
            </FormField>
            <FormField label={t("form.end")}>
              <FormInput
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                required
              />
            </FormField>
          </>
        )}
        <FormField label={t("form.notes")}>
          <FormInput
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("form.optional")}
          />
        </FormField>
        <FormButton color={colors.feeding} disabled={saving}>
          {saving ? t("form.saving") : isEdit ? t("feedingForm.update") : t("feedingForm.save")}
        </FormButton>
      </form>
    </Modal>
  );
}