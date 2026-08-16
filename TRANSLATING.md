# Translating the dashboard

Thanks for wanting to add a language. Adding one is a copy, a translation pass,
and four lines of wiring — no build tooling, no external i18n library, no
extraction step.

The dashboard ships with English (`en`, the default), Italian (`it`), and
German (`de`).

## Two separate translation systems

They are unrelated, and you probably only care about the first one:

| What | Where | Who sees it |
| --- | --- | --- |
| The dashboard UI | `baby-buddy-dashboard/frontend/src/locales/*.js` | Anyone using the dashboard, in the language they pick in Settings |
| The add-on config panel | `baby-buddy-dashboard/translations/*.yaml` | Home Assistant admins editing the add-on's options, in their **Home Assistant** language |

This guide is mostly about the first. The second is covered at the end, and is
entirely optional.

## Adding a UI language

### 1. Copy the English file

```bash
cp baby-buddy-dashboard/frontend/src/locales/en.js baby-buddy-dashboard/frontend/src/locales/fr.js
```

Use the ISO 639-1 code for the filename (`fr`, `pt`, `nl`, …).

Start from `en.js`, not from `it.js` or `de.js` — English is the fallback
source of truth, and it's the file that's guaranteed to be complete and
current.

### 2. Translate the values

The file is one nested object, about 370 lines, grouped by area — `common`,
`action`, `tab`, `overview`, `growth`, the various `*Form` sections, and
`time`:

```js
export default {
  common: {
    save: "Save",
    cancel: "Cancel",
    showMore: "Show {count} more",
    // ...
  },
  // ...
};
```

**Translate the values on the right. Never touch the keys on the left.** The
keys are what the components look up; renaming one means that string silently
falls back to English.

The rules that actually matter:

- **Keep `{placeholder}` tokens exactly as they are.** They're substituted at
  runtime by exact string match, so `{count}`, `{error}`, `{m}`, `{h}`, `{d}`,
  `{days}`, `{months}`, `{years}`, and `{elapsed}` must survive verbatim —
  same spelling, same braces. You can move them anywhere in the sentence,
  which is usually what you need for word order. A typo'd token is not an
  error; it just renders literally as `{count}` in the UI.
- **`time.dayNames` must stay an array of exactly 7 strings, starting with
  Sunday.** It's indexed directly by JavaScript's `Date.getDay()`, so the
  order is fixed regardless of which day your locale considers the start of
  the week. Keep them short — they're column headers on a narrow mobile chart.
- **Keep strings roughly as short as the English.** The UI is mobile-first;
  tab labels, buttons, and stat-card captions have very little room. If a
  faithful translation is much longer, prefer the shorter natural phrasing
  over the literal one.
- **There is no pluralization support.** `translate()` does plain string
  substitution, so `"Show {count} more"` gets whatever number it gets. For
  languages with more than two plural forms, phrase around it — a form that
  reads acceptably for every count (often a noun-first or count-suffixed
  construction) beats one that's correct only for *n* = 1.
- **Leaving a key untranslated is allowed.** Anything missing falls back to
  English automatically, and logs `Missing translation: <key>` to the browser
  console. A partial translation ships fine; it just shows English in the
  gaps. If you'd rather submit incrementally, that works.

### 3. Register it

All four edits are in `baby-buddy-dashboard/frontend/src/locales/index.js`:

```js
import en from "./en";
import it from "./it";
import de from "./de";
import fr from "./fr";                                    // 1. import it

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "it", label: "Italiano" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },                      // 2. add to the picker
];

const LOCALE_CODES = { en: "en-US", it: "it-IT", de: "de-DE", fr: "fr-FR" };  // 3. Intl locale

const languages = { en, it, de, fr };                     // 4. add to the lookup
```

A few notes on those four:

- `label` is the language's name **in that language** ("Français", not
  "French") — it's shown in the Settings picker, where a reader who doesn't
  speak the current UI language still needs to find their own.
- `LOCALE_CODES` is a BCP 47 tag passed to `toLocaleDateString()` and
  `toLocaleTimeString()`. This is what makes dates render as `16/08/2026`
  rather than `8/16/2026`. Pick the tag matching your region convention; if
  you're translating for a language with meaningful regional differences
  (`pt-BR` vs `pt-PT`), pick the one you're actually writing for and say so in
  the PR.
- Miss the `languages` entry and the language appears in the picker but
  renders entirely in English, because every lookup falls through.

### 4. Update the tests

Adding a language breaks **two** tests in `locales/index.test.js`, by design —
they're there so a new language can't be half-wired without someone noticing.

The first asserts the exact list of supported languages. Add your code and fix
the test name ("three" → "four"):

```js
it("lists exactly the four supported languages", () => {
  expect(SUPPORTED_LANGUAGES.map((l) => l.code)).toEqual(["en", "it", "de", "fr"]);
});
```

The second is easy to miss, because it fails only for *some* languages. It
checks that an unknown code is rejected — and it happens to use `"fr"` as its
example of an unknown code:

```js
it("ignores an unsupported language code", () => {
  setLanguage("fr");                     // ← now a *supported* code, so this passes through
  expect(getLanguage()).toBe("en");      // ← and this fails
});
```

If the code you're adding is the one this test uses as its example, swap the
example for something that will stay unsupported (`"zz"` is a safe choice —
it's reserved and will never be a real language). If you're adding a different
language, this test passes untouched.

Expect `npm test` to go red before you fix these. That's the intended
sequence, not a sign you did something wrong.

### 5. Check it

```bash
cd baby-buddy-dashboard/frontend
npm test
npm run build
```

Then run the dashboard, open **Settings → Language**, and pick your language.
Worth walking through with the browser console open:

- Every tab (Overview, Growth, Notes & Meds)
- Each entry form, including its validation and error states
- The Daily Report modals, and a CSV export
- A save failure, so you see the error banner text

Any `Missing translation:` warnings in the console point at keys you skipped or
mistyped. Watch for text overflowing its button or card — that's the usual
casualty of a longer language, and it's easier to fix by shortening the string
than by changing the layout.

The selection is stored in `localStorage` under `bbd_language`, so it's
per-browser, not per-Home-Assistant-user. Each person in the household picks
their own, and it persists across reloads on that device.

## If you find hardcoded English

If a string doesn't change when you switch languages, it was missed during
extraction. Fixing it is a small change:

```jsx
import { useTranslation } from "../locales";

function MyComponent() {
  const t = useTranslation();
  return <button>{t("common.save")}</button>;
}
```

Add the key to `en.js` first, then to every other locale file (or leave the
others to fall back). Grouping it under the section matching where it appears
keeps the files navigable.

Please mention any of these in your PR even if you don't fix them — knowing
which strings are still hardcoded is useful on its own.

## Translating the add-on config panel

Optional, and independent of everything above. `baby-buddy-dashboard/translations/en.yaml`
holds the field names and help text Home Assistant shows when an admin edits
the add-on's options.

```bash
cp baby-buddy-dashboard/translations/en.yaml baby-buddy-dashboard/translations/fr.yaml
```

Translate the `name` and `description` values, leave the option keys
(`baby_buddy_url`, `child_sex`, …) alone. No registration step — Home
Assistant picks the file matching the admin's own HA language and falls back
to `en.yaml` otherwise.

Note this tracks the *Home Assistant* language setting, not the dashboard's
own picker. Someone can quite reasonably run the dashboard in French with an
English config panel.

## Submitting

Open a PR with:

- the new `locales/xx.js`
- the `locales/index.js` wiring
- the updated `locales/index.test.js`
- optionally `translations/xx.yaml`

Say which region you translated for if it's ambiguous, and mention anything
you deliberately left in English. If you'd rather submit a partial translation
and finish later, that's fine — English fallback means partial files don't
break anything.
