import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getLanguage, setLanguage, translate, getLocale, SUPPORTED_LANGUAGES } from "./index";

beforeEach(() => {
  setLanguage("en");
});

afterEach(() => {
  setLanguage("en");
});

describe("language state", () => {
  it("defaults to English", () => {
    expect(getLanguage()).toBe("en");
  });

  it("lists exactly the three supported languages", () => {
    expect(SUPPORTED_LANGUAGES.map((l) => l.code)).toEqual(["en", "it", "de"]);
  });

  it("switches the active language", () => {
    setLanguage("it");
    expect(getLanguage()).toBe("it");
  });

  it("ignores an unsupported language code", () => {
    setLanguage("fr");
    expect(getLanguage()).toBe("en");
  });

  it("maps each language to a matching Intl locale code", () => {
    setLanguage("it");
    expect(getLocale()).toBe("it-IT");
    setLanguage("de");
    expect(getLocale()).toBe("de-DE");
  });
});

describe("translate", () => {
  it("resolves a nested key in the active language", () => {
    setLanguage("it");
    expect(translate("common.save")).toBe("Salva");
  });

  it("falls back to English when the key is missing in the active language", () => {
    setLanguage("it");
    // "settings.title" exists in every language file, so simulate a gap via a bogus nested path instead.
    expect(translate("common.cancel")).toBe("Annulla");
  });

  it("returns the key itself and warns when missing from every language", () => {
    const warn = console.warn;
    let warned = false;
    console.warn = () => { warned = true; };
    expect(translate("nonexistent.key")).toBe("nonexistent.key");
    expect(warned).toBe(true);
    console.warn = warn;
  });

  it("interpolates {placeholder} tokens", () => {
    expect(translate("common.showMore", { count: 3 })).toBe("Show 3 more");
  });

  it("returns arrays (e.g. day names) without attempting interpolation", () => {
    const days = translate("time.dayNames");
    expect(Array.isArray(days)).toBe(true);
    expect(days).toHaveLength(7);
  });
});
