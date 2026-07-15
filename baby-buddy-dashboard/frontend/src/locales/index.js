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

export function t(key, params) {
  // Aktuelle Sprache
  let translated = getNestedValue(languages[currentLanguage], key);

  // Fallback auf Englisch
  if (translated === undefined) {
    translated = getNestedValue(languages.en, key);
  }

  // Fehlenden Key im Debug sichtbar machen
  if (translated === undefined) {
    console.warn(`Missing translation: ${key}`);
    return key;
  }

  // Platzhalter wie {count}, {wet}, {solid} ersetzen
  if (params) {
    Object.entries(params).forEach(([paramKey, value]) => {
      translated = translated.replaceAll(`{${paramKey}}`, value);
    });
  }

  return translated;
}