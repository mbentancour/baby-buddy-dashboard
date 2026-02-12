import { useState } from "react";
import { api } from "../../api";
import Modal, { FormField, FormSelect, FormInput, FormButton } from "../Modal";
import { colors } from "../../utils/colors";

const TYPES = [
  { value: "breast milk", label: "Breast Milk" },
  { value: "formula", label: "Formula" },
  { value: "fortified breast milk", label: "Fortified Breast Milk" },
  { value: "solid food", label: "Solid Food" },
];

const METHODS = [
  { value: "bottle", label: "Bottle" },
  { value: "left breast", label: "Left Breast" },
  { value: "right breast", label: "Right Breast" },
  { value: "both breasts", label: "Both Breasts" },
  { value: "parent fed", label: "Parent Fed" },
  { value: "self fed", label: "Self Fed" },
];

function toLocalDatetime(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function FeedingForm({ childId, timerId, entry, onDone, onClose }) {
  const isEdit = !!entry;
  const now = new Date();
  const fifteenMinsAgo = new Date(now.getTime() - 15 * 60 * 1000);
  const [type, setType] = useState(entry?.type || "breast milk");
  const [method, setMethod] = useState(entry?.method || "bottle");
  const [amount, setAmount] = useState(entry?.amount != null ? String(entry.amount) : "");
  const [start, setStart] = useState(entry?.start ? toLocalDatetime(new Date(entry.start)) : toLocalDatetime(fifteenMinsAgo));
  const [end, setEnd] = useState(entry?.end ? toLocalDatetime(new Date(entry.end)) : toLocalDatetime(now));
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { type, method };
      if (amount) data.amount = parseFloat(amount);
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
    <Modal title={isEdit ? "Edit Feeding" : "Log Feeding"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormField label="Type">
          <FormSelect options={TYPES} value={type} onChange={(e) => setType(e.target.value)} />
        </FormField>
        <FormField label="Method">
          <FormSelect options={METHODS} value={method} onChange={(e) => setMethod(e.target.value)} />
        </FormField>
        <FormField label="Amount (mL)">
          <FormInput type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Optional" min="0" step="5" />
        </FormField>
        {(isEdit || !timerId) && (
          <>
            <FormField label="Start">
              <FormInput
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                required
              />
            </FormField>
            <FormField label="End">
              <FormInput
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                required
              />
            </FormField>
          </>
        )}
        <FormButton color={colors.feeding} disabled={saving}>
          {saving ? "Saving..." : isEdit ? "Update Feeding" : "Save Feeding"}
        </FormButton>
      </form>
    </Modal>
  );
}
