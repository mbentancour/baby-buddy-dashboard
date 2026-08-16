import { useState, useEffect } from "react";
import Modal from "./Modal";
import { api } from "../api";
import { buildDailyReport } from "../utils/formatters";
import { useUnits } from "../utils/units";
import { downloadFile } from "../utils/download";
import { colors } from "../utils/colors";
import { getMockData } from "../utils/mockData";
import ReportRangeBar from "./ReportRangeBar";
import { useTranslation } from "../locales";

function toLocalISODate(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export default function ReportModal({ childId, demoMode, onClose }) {
  const t = useTranslation();
  const units = useUnits();
  const [rangeDays, setRangeDays] = useState(7);
  const [loading, setLoading] = useState(!demoMode);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (demoMode) {
      const mock = getMockData(childId);
      setRows(
        buildDailyReport(
          mock.monthlyFeedings,
          mock.monthlyChanges,
          mock.monthlySleep,
          rangeDays,
          mock.monthlyTummyTimes
        )
      );
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const start = new Date();
    start.setDate(start.getDate() - (rangeDays - 1));
    const startMin = `${toLocalISODate(start)}T00:00:00`;
    const timeParams = { child: childId, start_min: startMin, limit: 1000, ordering: "-start" };
    const changeParams = { child: childId, date_min: startMin, limit: 1000, ordering: "-time" };

    Promise.all([
      api.getFeedings(timeParams),
      api.getChanges(changeParams),
      api.getSleep(timeParams),
      api.getTummyTimes(timeParams),
    ])
      .then(([feedingsRes, changesRes, sleepRes, tummyRes]) => {
        if (cancelled) return;
        setRows(
          buildDailyReport(
            feedingsRes.results || [],
            changesRes.results || [],
            sleepRes.results || [],
            rangeDays,
            tummyRes.results || []
          )
        );
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
  }, [rangeDays, childId, demoMode]);

  const totals = rows.reduce(
    (acc, r) => ({
      amount: acc.amount + r.amount,
      feedCount: acc.feedCount + r.feedCount,
      wet: acc.wet + r.wet,
      solid: acc.solid + r.solid,
      both: acc.both + r.both,
      sleepHours: acc.sleepHours + r.sleepHours,
      tummyMinutes: acc.tummyMinutes + r.tummyMinutes,
    }),
    { amount: 0, feedCount: 0, wet: 0, solid: 0, both: 0, sleepHours: 0, tummyMinutes: 0 }
  );

  const handleExport = () => {
    const header = [`Date`, `Amount (${units.volume})`, "Feedings", "Wet", "Solid", "Both", "Sleep (h)", "Tummy (min)"];
    const lines = rows.map((r) =>
      [r.date, r.amount, r.feedCount, r.wet, r.solid, r.both, r.sleepHours, r.tummyMinutes].join(",")
    );
    downloadFile(`baby-buddy-growth-report-${rangeDays}d.csv`, [header.join(","), ...lines].join("\n"), "text/csv");
  };

  const cellStyle = { padding: "8px 6px", textAlign: "right", whiteSpace: "nowrap" };
  const columns = [units.volume, t("report.columnFeedings"), t("report.columnWet"), t("report.columnSolid"), t("report.columnBoth"), t("report.columnSleepH"), t("report.columnTummyMin")];

  return (
    <Modal title={t("report.growthTitle")} onClose={onClose} maxWidth={720}>
      <ReportRangeBar
        rangeDays={rangeDays}
        setRangeDays={setRangeDays}
        onExport={handleExport}
        exportDisabled={loading || rows.length === 0}
      />

      {loading ? (
        <div style={{ color: "var(--text-dim)", fontSize: 13, textAlign: "center", padding: 40 }}>
          {t("common.loading")}
        </div>
      ) : error ? (
        <div style={{ color: "#EF4444", fontSize: 13, textAlign: "center", padding: 40 }}>
          {t("report.failedToLoadReport", { error })}
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th style={{ textAlign: "left", padding: "8px 6px", color: "var(--text-dim)", fontWeight: 500 }}>{t("report.columnDate")}</th>
                {columns.map((h) => (
                  <th key={h} style={{ ...cellStyle, color: "var(--text-dim)", fontWeight: 500 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.date} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "8px 6px", color: "var(--text)", fontWeight: 600, whiteSpace: "nowrap" }}>{r.date}</td>
                  <td style={{ ...cellStyle, color: colors.feeding }}>{r.amount || "—"}</td>
                  <td style={{ ...cellStyle, color: "var(--text-muted)" }}>{r.feedCount || "—"}</td>
                  <td style={{ ...cellStyle, color: "#3B82F6" }}>{r.wet || "—"}</td>
                  <td style={{ ...cellStyle, color: "#D97706" }}>{r.solid || "—"}</td>
                  <td style={{ ...cellStyle, color: "var(--text-muted)" }}>{r.both || "—"}</td>
                  <td style={{ ...cellStyle, color: colors.sleep }}>{r.sleepHours || "—"}</td>
                  <td style={{ ...cellStyle, color: colors.tummy }}>{r.tummyMinutes || "—"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td style={{ padding: "10px 6px", color: "var(--text)", fontWeight: 700 }}>{t("report.columnTotal")}</td>
                <td style={{ ...cellStyle, color: "var(--text)", fontWeight: 700 }}>{totals.amount}</td>
                <td style={{ ...cellStyle, color: "var(--text)", fontWeight: 700 }}>{totals.feedCount}</td>
                <td style={{ ...cellStyle, color: "var(--text)", fontWeight: 700 }}>{totals.wet}</td>
                <td style={{ ...cellStyle, color: "var(--text)", fontWeight: 700 }}>{totals.solid}</td>
                <td style={{ ...cellStyle, color: "var(--text)", fontWeight: 700 }}>{totals.both}</td>
                <td style={{ ...cellStyle, color: "var(--text)", fontWeight: 700 }}>{totals.sleepHours.toFixed(1)}</td>
                <td style={{ ...cellStyle, color: "var(--text)", fontWeight: 700 }}>{totals.tummyMinutes}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </Modal>
  );
}
