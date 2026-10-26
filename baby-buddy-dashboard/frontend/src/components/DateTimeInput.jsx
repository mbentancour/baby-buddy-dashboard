import { useEffect, useState } from "react";
import { useTranslation } from "../locales";
import { FormInput } from "./Modal";

export function formatTimeDigits(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
}

export function isValidTime(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export default function DateTimeInput({ value, onChange, required = false }) {
  const t = useTranslation();
  const [date, time = ""] = value.split("T");
  const [timeDraft, setTimeDraft] = useState(time);

  useEffect(() => {
    setTimeDraft(time);
  }, [time]);

  const updateTime = (nextValue) => {
    const nextTime = formatTimeDigits(nextValue);
    setTimeDraft(nextTime);
    if (date && isValidTime(nextTime)) onChange(`${date}T${nextTime}`);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 92px", gap: 8 }}>
      <FormInput
        type="date"
        value={date}
        onChange={(event) => onChange(`${event.target.value}T${isValidTime(timeDraft) ? timeDraft : time}`)}
        aria-label={t("common.date")}
        required={required}
      />
      <FormInput
        type="text"
        inputMode="numeric"
        enterKeyHint="done"
        autoComplete="off"
        value={timeDraft}
        onChange={(event) => updateTime(event.target.value)}
        onBlur={() => {
          if (!isValidTime(timeDraft)) setTimeDraft(time);
        }}
        placeholder="HH:MM"
        pattern="([01][0-9]|2[0-3]):[0-5][0-9]"
        maxLength={5}
        aria-label={t("common.time")}
        required={required}
      />
    </div>
  );
}
