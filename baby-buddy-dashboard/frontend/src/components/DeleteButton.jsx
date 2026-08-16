import { useState } from "react";
import { useTranslation } from "../locales";

export default function DeleteButton({ onDelete, disabled }) {
  const t = useTranslation();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    await onDelete();
    setDeleting(false);
  };

  if (confirming) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          marginBottom: 14,
          padding: "8px 12px",
          borderRadius: 10,
          background: "#EF444412",
          border: "1px solid #EF444430",
        }}
      >
        <span style={{ fontSize: 12, color: "var(--text)" }}>{t("common.deleteThisEntry")}</span>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={deleting}
          style={{
            padding: "4px 12px",
            fontSize: 12,
            fontWeight: 700,
            color: "#fff",
            background: "#EF4444",
            border: "none",
            borderRadius: 6,
            cursor: deleting ? "default" : "pointer",
            fontFamily: "inherit",
          }}
        >
          {deleting ? t("common.deleting") : t("common.delete")}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={deleting}
          style={{
            padding: "4px 12px",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text-muted)",
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: 6,
            cursor: deleting ? "default" : "pointer",
            fontFamily: "inherit",
          }}
        >
          {t("common.cancel")}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      disabled={disabled}
      style={{
        display: "block",
        width: "100%",
        marginBottom: 14,
        padding: "4px 0",
        background: "none",
        border: "none",
        color: "#EF4444",
        fontSize: 12,
        fontWeight: 600,
        fontFamily: "inherit",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1,
        textAlign: "center",
      }}
    >
      {t("common.delete")}
    </button>
  );
}
