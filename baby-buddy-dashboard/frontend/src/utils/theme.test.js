import { describe, it, expect } from "vitest";
import { buildThemeCss } from "./theme";

const FULL_LIGHT = {
  bg: "#F5F2EA",
  cardBg: "#FDFCF8",
  border: "rgba(40, 30, 16, 0.08)",
  text: "#1B1812",
  textMuted: "#6B6557",
  textDim: "#A8A294",
  accent: "#2A9D8F",
};

const FULL_DARK = {
  bg: "#14110C",
  cardBg: "#1C1814",
  border: "rgba(245, 242, 234, 0.08)",
  text: "#F2EFE6",
  textMuted: "#A8A294",
  textDim: "#6B6557",
  accent: "#3FB8A9",
};

describe("buildThemeCss", () => {
  it("returns an empty string when nothing is configured", () => {
    expect(buildThemeCss()).toBe("");
    expect(buildThemeCss({})).toBe("");
  });

  it("emits only the light media block when only light is fully configured", () => {
    const css = buildThemeCss({ light: FULL_LIGHT });
    expect(css).toContain("prefers-color-scheme: light");
    expect(css).not.toContain("prefers-color-scheme: dark");
    expect(css).toContain("--bg: #F5F2EA;");
    expect(css).toContain("--accent: #2A9D8F;");
  });

  it("emits both media blocks when both modes are fully configured", () => {
    const css = buildThemeCss({ light: FULL_LIGHT, dark: FULL_DARK });
    expect(css).toContain("prefers-color-scheme: light");
    expect(css).toContain("prefers-color-scheme: dark");
    expect(css).toContain("--bg: #14110C;");
  });

  it("skips a mode entirely if even one field is missing, to avoid an unreadable partial theme", () => {
    const partialLight = { ...FULL_LIGHT, text: "" };
    const css = buildThemeCss({ light: partialLight, dark: FULL_DARK });
    expect(css).not.toContain("prefers-color-scheme: light");
    expect(css).toContain("prefers-color-scheme: dark");
  });

  it("maps every app color token to its CSS custom property", () => {
    const css = buildThemeCss({ light: FULL_LIGHT });
    expect(css).toContain("--card-bg: #FDFCF8;");
    expect(css).toContain("--border: rgba(40, 30, 16, 0.08);");
    expect(css).toContain("--text-muted: #6B6557;");
    expect(css).toContain("--text-dim: #A8A294;");
  });
});
