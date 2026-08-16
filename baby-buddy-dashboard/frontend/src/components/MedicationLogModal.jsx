import { useState, useEffect } from "react";
import Modal from "./Modal";
import { api } from "../api";
import { downloadFile } from "../utils/download";
import { colors } from "../utils/colors";
import ReportRangeBar from "./ReportRangeBar";
import { useTranslation, getLocale } from "../locales";
import { translateDosageUnit } from "../utils/formatters";

function toLocalISODate(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export default function MedicationLogModal({ childId, onClose }) {
  const t = useTranslation();
  const [rangeDays, setRangeDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const start = new Date();
    start.setDate(start.getDate() - (rangeDays - 1));
    const dateMin = `${toLocalISODate(start)}T00:00:00`;

    api
      .getMedication({ child: childId, date_min: dateMin, limit: 1000, ordering: "-time" })
      .then((res) => {
        if (!cancelled) setEntries(res.results || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [rangeDays, childId]);

  const handleExport = () => {
    const header = ["Date", "Time", "Medication", "Dosage", "Unit", "Notes"];
    const lines = entries.map((e) => {
      const d = new Date(e.time);
      return [
        toLocalISODate(d),
        d.toLocaleTimeString(getLocale(), { hour: "2-digit", minute: "2-digit" }),
        e.name,
        e.dosage ?? "",
        e.dosage_unit ?? "",
        (e.notes || "").replace(/,/g, ";"),
      ].join(",");
    });
    downloadFile(`baby-buddy-medication-log-${rangeDays}d.csv`, [header.join(","), ...lines].join("\n"), "text/csv");
  };

  const cellStyle = { padding: "8px 6px", textAlign: "left", whiteSpace: "nowrap" };
  const columns = [t("medicationLog.columnDate"), t("medicationLog.columnTime"), t("medicationLog.columnMedication"), t("medicationLog.columnDosage"), t("medicationLog.columnNotes")];

  return (
    <Modal title={t("medicationLog.title")} onClose={onClose} maxWidth={600}>
      <ReportRangeBar
        rangeDays={rangeDays}
        setRangeDays={setRangeDays}
        onExport={handleExport}
        exportDisabled={loading || entries.length === 0}
      />

      {loading ? (
        <div style={{ color: "var(--text-dim)", fontSize: 13, textAlign: "center", padding: 40 }}>
          {t("common.loading")}
        </div>
      ) : error ? (
        <div style={{ color: "#EF4444", fontSize: 13, textAlign: "center", padding: 40 }}>
          {t("medicationLog.failedToLoad", { error })}
        </div>
      ) : entries.length === 0 ? (
        <div style={{ color: "var(--text-dim)", fontSize: 13, textAlign: "center", padding: 40 }}>
          {t("medicationLog.noneInRange")}
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {columns.map((h) => (
                  <th key={h} style={{ ...cellStyle, color: "var(--text-dim)", fontWeight: 500 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => {
                const d = new Date(e.time);
                return (
                  <tr key={e.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ ...cellStyle, color: "var(--text-muted)" }}>
                      {d.toLocaleDateString(getLocale(), { month: "short", day: "numeric" })}
                    </td>
                    <td style={{ ...cellStyle, color: "var(--text-muted)" }}>
                      {d.toLocaleTimeString(getLocale(), { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td style={{ ...cellStyle, color: colors.medication, fontWeight: 600 }}>{e.name}</td>
                    <td style={{ ...cellStyle, color: "var(--text)" }}>
                      {e.dosage ? `${e.dosage}${e.dosage_unit ? ` ${translateDosageUnit(e.dosage_unit)}` : ""}` : "—"}
                    </td>
                    <td style={{ ...cellStyle, color: "var(--text-muted)", whiteSpace: "normal" }}>{e.notes || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}
