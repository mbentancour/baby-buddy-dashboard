import { useSyncExternalStore } from "react";
import en from "./en";
import it from "./it";
import de from "./de";

const STORAGE_KEY = "bbd_language";
const DEFAULT_LANGUAGE = "en";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "it", label: "Italiano" },
  { code: "de", label: "Deutsch" },
];

const LOCALE_CODES = { en: "en-US", it: "it-IT", de: "de-DE" };

const languages = { en, it, de };

function loadLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && languages[saved]) return saved;
  } catch {
    // localStorage unavailable - fall back to default
  }
  return DEFAULT_LANGUAGE;
}

let currentLanguage = loadLanguage();
const listeners = new Set();

export function getLanguage() {
  return currentLanguage;
}

export function getLocale() {
  return LOCALE_CODES[currentLanguage] || LOCALE_CODES[DEFAULT_LANGUAGE];
}

export function setLanguage(lang) {
  if (!languages[lang] || lang === currentLanguage) return;
  currentLanguage = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // localStorage unavailable - selection just won't persist across reloads
  }
  listeners.forEach((l) => l());
}

export function subscribeLanguage(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getNestedValue(obj, path) {
  return path.split(".").reduce((value, key) => value?.[key], obj);
}

export function translate(key, params) {
  let value = getNestedValue(languages[currentLanguage], key);
  if (value === undefined) value = getNestedValue(languages[DEFAULT_LANGUAGE], key);
  if (value === undefined) {
    console.warn(`Missing translation: ${key}`);
    return key;
  }
  if (Array.isArray(value)) return value;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      value = value.replaceAll(`{${k}}`, v);
    });
  }
  return value;
}

export function useTranslation() {
  useSyncExternalStore(subscribeLanguage, getLanguage);
  return translate;
}
