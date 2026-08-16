const KEYS = ["bg", "cardBg", "border", "text", "textMuted", "textDim", "accent"];
const VAR_NAMES = {
  bg: "--bg",
  cardBg: "--card-bg",
  border: "--border",
  text: "--text",
  textMuted: "--text-muted",
  textDim: "--text-dim",
  accent: "--accent",
};

function isComplete(mode) {
  return !!mode && KEYS.every((k) => !!mode[k]);
}

function modeBlock(mode) {
  const declarations = KEYS.map((k) => `      ${VAR_NAMES[k]}: ${mode[k]};`).join("\n");
  return `  :root {\n${declarations}\n  }`;
}

/**
 * Builds a <style> tag's CSS text overriding the app's base theme variables per
 * light/dark mode, from user-supplied colors (add-on config). A mode is only applied
 * if every field for it is set - a partial override risks unreadable combinations
 * (e.g. light background with the default light-on-dark text color).
 */
export function buildThemeCss({ light, dark } = {}) {
  const blocks = [];
  if (isComplete(light)) {
    blocks.push(`@media (prefers-color-scheme: light) {\n${modeBlock(light)}\n}`);
  }
  if (isComplete(dark)) {
    blocks.push(`@media (prefers-color-scheme: dark) {\n${modeBlock(dark)}\n}`);
  }
  return blocks.join("\n\n");
}

const STYLE_TAG_ID = "custom-theme-overrides";

export function applyTheme(themeConfig) {
  const css = buildThemeCss(themeConfig);
  let tag = document.getElementById(STYLE_TAG_ID);
  if (!css) {
    tag?.remove();
    return;
  }
  if (!tag) {
    tag = document.createElement("style");
    tag.id = STYLE_TAG_ID;
    document.head.appendChild(tag);
  }
  tag.textContent = css;
}
