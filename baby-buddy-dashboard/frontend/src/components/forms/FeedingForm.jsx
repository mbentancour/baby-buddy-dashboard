import { useContext, useState } from "react";
import { api } from "../../api";
import Modal, { FormField, FormSelect, FormInput, FormButton, FormError } from "../Modal";
import DateTimeInput from "../DateTimeInput";
import DeleteButton from "../DeleteButton";
import { colors } from "../../utils/colors";
import {
  UnitContext,
  millilitersToOunces,
  ouncesToMilliliters,
} from "../../utils/units";
import { logError } from "../../utils/errorLog";
import { useTranslation } from "../../locales";
import { toApiDatetime } from "../../utils/formatters";

function toLocalDatetime(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function FeedingForm({ childId, timerId, entry, onDone, onClose }) {
  const t = useTranslation();
  const unitSystem = useContext(UnitContext);
  const isEdit = !!entry;
  const initialAmountUnit = unitSystem === "imperial" ? "oz" : "ml";

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

  const now = new Date();
  const fifteenMinsAgo = new Date(now.getTime() - 15 * 60 * 1000);
  const [type, setType] = useState(entry?.type || "breast milk");
  const [method, setMethod] = useState(entry?.method || "bottle");
  const [amountUnit, setAmountUnit] = useState(initialAmountUnit);
  const [amount, setAmount] = useState(
    entry?.amount != null
      ? String(initialAmountUnit === "oz" ? millilitersToOunces(entry.amount) : entry.amount)
      : ""
  );
  const [start, setStart] = useState(entry?.start ? toLocalDatetime(new Date(entry.start)) : toLocalDatetime(fifteenMinsAgo));
  const [end, setEnd] = useState(entry?.end ? toLocalDatetime(new Date(entry.end)) : toLocalDatetime(now));
  const [notes, setNotes] = useState(entry?.notes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const data = { type, method };
      if (amount) {
        const parsedAmount = parseFloat(amount);
        data.amount = amountUnit === "oz" ? ouncesToMilliliters(parsedAmount) : parsedAmount;
      }
      if (notes.trim()) data.notes = notes.trim();
      if (isEdit) {
        data.start = toApiDatetime(start);
        data.end = toApiDatetime(end);
        await api.updateFeeding(entry.id, data);
      } else {
        data.child = childId;
        if (timerId) {
          data.timer = timerId;
        } else {
          data.start = toApiDatetime(start);
          data.end = toApiDatetime(end);
        }
        await api.createFeeding(data);
      }
      onDone();
    } catch (err) {
      setSaving(false);
      setError(t("common.saveFailed"));
      logError(isEdit ? "Update Feeding" : "Save Feeding", err.message);
    }
  };

  const handleDelete = async () => {
    setError(null);
    try {
      await api.deleteFeeding(entry.id);
      onDone();
    } catch (err) {
      setError(t("common.deleteFailed"));
      logError("Delete Feeding", err.message);
    }
  };

  return (
    <Modal title={isEdit ? t("feedingForm.editTitle") : t("feedingForm.logTitle")} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormField label={t("form.type")}>
          <FormSelect options={TYPES} value={type} onChange={(e) => setType(e.target.value)} />
        </FormField>
        <FormField label={t("form.method")}>
          <FormSelect options={METHODS} value={method} onChange={(e) => setMethod(e.target.value)} />
        </FormField>
        <FormField label={t("feedingForm.amount", { unit: amountUnit === "oz" ? "oz" : "mL" })}>
          <FormInput
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={t("common.optional")}
            min="0"
            step="any"
          />
        </FormField>
        <FormField label={t("feedingForm.unit")}>
          <FormSelect
            options={[
              { value: "ml", label: "mL" },
              { value: "oz", label: "oz" },
            ]}
            value={amountUnit}
            onChange={(e) => {
              const nextUnit = e.target.value;
              if (amount) {
                const converted =
                  nextUnit === "oz"
                    ? millilitersToOunces(amount)
                    : ouncesToMilliliters(amount);
                setAmount(String(converted));
              }
              setAmountUnit(nextUnit);
            }}
          />
        </FormField>
        {(isEdit || !timerId) && (
          <>
            <FormField label={t("common.start")}>
              <DateTimeInput value={start} onChange={setStart} required />
            </FormField>
            <FormField label={t("common.end")}>
              <DateTimeInput value={end} onChange={setEnd} required />
            </FormField>
          </>
        )}
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
        <FormButton color={colors.feeding} disabled={saving}>
          {saving ? t("common.saving") : isEdit ? t("feedingForm.update") : t("feedingForm.save")}
        </FormButton>
      </form>
    </Modal>
  );
}
