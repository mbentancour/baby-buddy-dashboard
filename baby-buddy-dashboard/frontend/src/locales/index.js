import en from "./en";
import de from "./de";

const languages = {
  de,
  en,
};

const currentLanguage = navigator.language.toLowerCase().startsWith("de")
  ? "de"
  : "en";

function getNestedValue(obj, path) {
  return path.split(".").reduce((value, key) => value?.[key], obj);
}

export function t(key) {
  // Aktuelle Sprache
  const translated = getNestedValue(languages[currentLanguage], key);
  if (translated !== undefined) {
    return translated;
  }

  // Fallback auf Englisch
  const fallback = getNestedValue(languages.en, key);
  if (fallback !== undefined) {
    return fallback;
  }

  // Fehlenden Key im Debug sichtbar machen
  console.warn(`Missing translation: ${key}`);
  return key;
}