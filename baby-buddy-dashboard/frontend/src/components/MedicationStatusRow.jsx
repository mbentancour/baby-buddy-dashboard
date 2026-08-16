import { useState } from "react";
import { api } from "../api";
import { Icons } from "./Icons";
import { colors } from "../utils/colors";
import { formatDueLabel, formatDurationString } from "../utils/formatters";
import { logError } from "../utils/errorLog";
import { useTranslation, getLocale } from "../locales";

function toLocalDatetime(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function MedicationStatusRow({ status, childId, onUpdated }) {
  const t = useTranslation();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [nextDoseInput, setNextDoseInput] = useState(toLocalDatetime(status.dueAt));

  const handleMarkTaken = async () => {
    setSaving(true);
    setError(null);
    try {
      const data = {
        child: childId,
        name: status.entry.name,
        time: new Date().toISOString(),
      };
      if (status.entry.dosage != null) data.dosage = status.entry.dosage;
      if (status.entry.dosage_unit) data.dosage_unit = status.entry.dosage_unit;
      if (status.entry.next_dose_interval) data.next_dose_interval = status.entry.next_dose_interval;
      // A row that isn't the current slot represents a backlog dose whose window already
      // closed - always logged for "now" (never backdated, so the record reflects when it
      // was actually given), but noted as late so it's clear on review why the timing looks
      // off relative to the schedule.
      if (!status.current) {
        data.notes = t("notes.lateDoseNote", {
          dueDate: status.dueAt.toLocaleDateString(getLocale(), { month: "short", day: "numeric" }),
          dueTime: status.dueAt.toLocaleTimeString(getLocale(), { hour: "2-digit", minute: "2-digit" }),
        });
      }
      await api.createMedication(data);
      await onUpdated?.();
    } catch (err) {
      setError(t("notes.failedToLogDose"));
      logError("Mark Medication Taken", err.message);
    }
    setSaving(false);
  };

  const handleSaveNextDose = async () => {
    if (!nextDoseInput) return;
    const target = new Date(nextDoseInput);
    const lastDoseTime = new Date(status.entry.time);
    const hours = (target.getTime() - lastDoseTime.getTime()) / 3600000;
    if (hours <= 0) {
      setError(t("notes.nextDoseMustBeAfterLastDose"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.updateMedication(status.entry.id, { next_dose_interval: formatDurationString(hours) });
      setEditing(false);
      await onUpdated?.();
    } catch (err) {
      setError(t("notes.failedToUpdateNextDose"));
      logError("Update Next Dose", err.message);
    }
    setSaving(false);
  };

  return (
    <div
      style={{
        padding: "8px 12px",
        borderRadius: 10,
        background: status.overdue ? "#EF444412" : `${colors.medication}10`,
        border: `1px solid ${status.overdue ? "#EF444430" : `${colors.medication}25`}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{status.name}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => setEditing((e) => !e)}
            title={t("notes.setNextDoseTime")}
            style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", padding: 2, display: "flex" }}
            aria-label={t("notes.setNextDoseTime")}
          >
            <Icons.Clock />
          </button>
          <span style={{ fontSize: 11, fontWeight: 600, color: status.overdue ? "#EF4444" : colors.medication, whiteSpace: "nowrap" }}>
            {formatDueLabel(status.dueAt)}
          </span>
          <button
            onClick={handleMarkTaken}
            disabled={saving}
            style={{
              padding: "3px 10px",
              fontSize: 11,
              fontWeight: 600,
              color: colors.medication,
              background: `${colors.medication}20`,
              border: `1px solid ${colors.medication}30`,
              borderRadius: 6,
              cursor: saving ? "default" : "pointer",
              whiteSpace: "nowrap",
              fontFamily: "inherit",
            }}
          >
            {saving ? t("notes.savingEllipsis") : t("notes.markAsTaken")}
          </button>
        </div>
      </div>
      {editing && (
        <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
          <input
            type="datetime-local"
            value={nextDoseInput}
            onChange={(e) => setNextDoseInput(e.target.value)}
            style={{
              flex: 1,
              padding: "6px 8px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--bg)",
              color: "var(--text)",
              fontSize: 12,
              fontFamily: "inherit",
              colorScheme: "dark",
            }}
          />
          <button
            onClick={handleSaveNextDose}
            disabled={saving}
            style={{
              padding: "6px 12px",
              fontSize: 11,
              fontWeight: 600,
              color: "#22C55E",
              background: "#22C55E15",
              border: "1px solid #22C55E40",
              borderRadius: 8,
              cursor: saving ? "default" : "pointer",
              fontFamily: "inherit",
              whiteSpace: "nowrap",
            }}
          >
            {t("common.save")}
          </button>
        </div>
      )}
      {error && <div style={{ color: "#EF4444", fontSize: 11, marginTop: 6 }}>{error}</div>}
    </div>
  );
}
