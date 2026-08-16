# Changelog

## 1.7.7

- Added a second overdue-medication row: if a dose's window has fully
  passed without being logged before the next one comes due, it now
  shows as its own "Overdue by..." row, separate from the still-open
  current dose (which stays in its normal state until it, too,
  elapses). Each row has its own "Mark as taken" button. Marking a
  missed row as taken always logs it for the actual current time
  (never backdated), with an automatic note recording that it was
  logged late and when it was originally due - by design, this never
  suggests giving two doses at once. Capped at 10 backlog rows per
  medication so a long-neglected recurring medication can't produce
  an unbounded list.
- Added a device-vs-server clock comparison to the error log for
  failed saves (e.g. "Date/time can not be in the future"), to tell
  apart a genuine clock skew from a code bug going forward. Fixed a
  bug found while building this: the backend was forwarding Baby
  Buddy's `Date` response header under the same name uvicorn already
  uses for its own, producing two "Date" headers that browsers merge
  into one unparseable value - now forwarded as `X-Baby-Buddy-Date`
  instead.

## 1.7.6

- Fixed a real-world bug where saving or editing a Feeding (or Sleep,
  Diaper, Tummy Time, Temperature, Medication, Note, or a running
  timer) could fail with "Date/time can not be in the future" or a
  bogus overlap conflict, even for an entry logged seconds ago. Every
  form sent its date/time to Baby Buddy as a plain local string with
  no timezone info; Baby Buddy's API (at least for token-authenticated
  requests, which this add-on always uses) parses that as UTC
  regardless of the household's actual timezone or Baby Buddy's own
  per-user timezone setting - a couple of hours off was enough to look
  like "the future". Every form now sends an explicit, unambiguous UTC
  timestamp instead.
- Added automatic BMI calculation: saving a Weight or Height entry now
  checks for a matching entry (the other measurement, same date) and
  creates or updates the corresponding BMI entry on Baby Buddy to
  match - no more logging BMI a third time by hand when it's fully
  determined by two measurements you already took. Respects the
  add-on's configured unit system for the conversion (Baby Buddy
  itself has no unit concept - weight/height are just numbers).

## 1.7.5

- Fixed a custom theme (1.7.0) briefly flashing the default dark
  colors on every page load, even in light mode, before switching to
  the configured light theme. Two causes, both fixed:
  - `index.html` had a hardcoded `body { background: #0F1117; }`
    (the built-in dark color) meant to avoid a white flash before the
    stylesheet loads - it didn't know about theme overrides, so it
    painted dark first regardless of configuration. Now uses
    `var(--bg, #0F1117)`, same fallback, but themed once a value is
    available.
  - The backend now inlines the resolved theme directly into
    `index.html`'s `<head>` on every request (instead of waiting on
    the client's own config fetch after mount), so the right colors
    are already known before the page paints at all - caught and
    fixed a real bug in this while testing locally, where the
    override was landing before the built stylesheet's `<link>` and
    silently losing the CSS cascade to the stylesheet's unthemed
    defaults every time.

## 1.7.4

- Fixed the app being able to get stuck on the "Loading..." screen
  forever with no way to recover short of a manual page reload. Every
  API request (including the very first one, which fetches the
  add-on's config and gates the loading spinner) used a plain
  `fetch()` with no timeout - if a request just stalled instead of
  failing outright (flaky wifi, a backgrounded mobile browser tab, an
  ingress proxy that silently drops the response), its promise never
  settled, so the code that clears the spinner never ran. Requests
  now abort after 15s and surface as a normal connection error - the
  existing "Connection error" header banner and empty-state UI, which
  already existed for a failed request, now also cover a hung one.

## 1.7.3

- Added a "Color Preset" add-on option (`color_preset`) that fills in
  the 14 `theme_*` fields (added in 1.7.0) for you: pick
  `teal_terracotta` - a warm cream/near-black scheme with a teal
  accent, for light and dark mode - instead of typing all 14 colors
  by hand. Any individual `theme_*` field you also set overrides the
  preset's value for that one field only, so you can start from a
  preset and tweak just what you want. Leave it unset and nothing
  changes.

## 1.7.2

- Fixed custom theme colors (added in 1.7.0) rendering cards with no
  visible contrast against the page background on some Home Assistant
  Supervisor versions. Root cause: a leftover, unconfigured theme
  option (e.g. `theme_light_border`) could be read back as the
  literal text "null" instead of empty - the add-on then emitted
  invalid CSS like `--card-bg: null;`, which browsers silently
  resolve to transparent rather than falling back to the built-in
  theme. Unset theme fields are now always treated as empty,
  regardless of how the Supervisor reports them.

## 1.7.1

- Added breastfeeding session duration. Recent Feedings entries for
  left/right/both-breast feeds now show how long the session lasted
  (e.g. "Left Breast · 20m") - bottle feeds are unaffected since the
  mL amount is already the more meaningful number there. The Growth
  tab's Avg Feeding card also gains a "~15m avg breast duration" line
  alongside the existing average gap.

## 1.7.0

- Added custom theme colors and a CI test workflow.
  - 14 new optional add-on options let you match the dashboard to
    your own Home Assistant theme: background, card background,
    border, text, muted text, dim text, and an accent color, each for
    light and dark mode separately (e.g. `theme_light_bg`,
    `theme_dark_accent`). Light/dark switching follows the device's
    own color-scheme setting automatically. Per-category colors
    (feeding, sleep, diaper, ...) are intentionally not affected -
    they're functional, not decorative. Leave everything unset (the
    default) and nothing changes from today's look; a mode is only
    overridden once all seven of its fields are filled in, to avoid
    an unreadable half-themed page.
  - Added `.github/workflows/test.yml`: runs the full frontend
    (Vitest) and backend (pytest) suites, plus a production build, on
    every push and pull request.

## 1.6.0

- Added WHO growth-standard percentile overlays to the Weight, Height,
  Head Circumference, and BMI trend charts. Toggle "WHO percentiles"
  on any of them to switch that chart from a calendar-date axis to
  age-in-weeks, with P3-P97 and P15-P85 shaded bands and a P50 median
  reference line from the official WHO Child Growth Standards behind
  your child's own measurements. Requires the new "Child's Sex"
  add-on option (Baby Buddy itself doesn't store this) - leave it
  unset and the toggle simply doesn't appear.
- Fixed a bug where the "Medication Alerts" add-on option (added in
  1.4.0) never actually reached the running add-on - `run.sh` was
  missing the line that exports it as an environment variable, so it
  silently no-opped even when enabled in the add-on's configuration.

## 1.5.0

- Added full translation support: English, Italian, and German. A
  language selector now lives in the Settings panel; the choice is
  saved on the device (not a shared add-on setting), defaults to
  English, and falls back to English for any string a language is
  missing. Covers every screen - tabs, all 11 entry forms, reports,
  the medication log, chart labels, and relative-time text ("43m
  ago", "Overdue by 3h 20m", age display) - plus locale-aware date
  and number formatting (e.g. Italian "22 giu" / German "22. Jun"
  instead of always English month names). Built as a `locales/`
  folder with one file per language, so anyone can contribute another
  language later with just a new file, the same approach used by an
  existing community PR for German that this implementation is
  compatible with in spirit (dependency-free, English-fallback `t()`
  helper).

## 1.4.2

- Added an "avg gap" line to the Growth tab's Avg Feeding card (e.g.
  "~4h 39m avg gap") - the actual average time between consecutive
  feedings over the last 30 days, not just a derived "feedings/day"
  count.

## 1.4.1

- Fixed the Recent Feedings list showing "X ago" (time since now) on
  every entry, which was redundant past the first one. Only the most
  recent feeding now shows time-since-now; every other entry shows
  the gap to the next (more recent) feeding instead, e.g. "43m gap" -
  the actual spacing between feeds, not a second "ago" for the same
  moment in time.

## 1.4.0

- Replaced the two separate header icons (manual refresh, error log)
  with a single Settings panel: a connection-status row ("Connected"
  in green with last sync time, or the error in red) followed by the
  error log/export/clear section that used to be its own popup.
- Temperature entries can now be edited and deleted, like every other
  metric - previously there was no edit mode at all. Added a
  Temperature card (Notes & Meds tab, next to Medications) with a
  48h/72h/96h trend chart, since a short high-resolution window
  matters more than a 30-day trend when tracking a fever.
- Added a small pulsing red dot on the "Notes & Meds" tab button
  whenever any medication is currently overdue, so it's visible
  without opening the tab.
- Added an opt-in "Medication Alerts" option that exposes a single
  `binary_sensor.baby_buddy_medication_overdue` entity in Home
  Assistant (via the Supervisor's Core API, no MQTT broker needed),
  reflecting whether any medication is currently overdue across all
  children. Off by default; build your own automation/notification
  on top of it once enabled.
- Added an automated test suite: Vitest for the frontend, pytest for
  the backend, both fully mocked with zero live calls to a real Baby
  Buddy or Home Assistant instance.

## 1.3.4

- Added the ability to delete an entry when editing it - every "Edit"
  form (Feeding, Sleep, Diaper, Tummy Time, Weight, Height, Head
  Circumference, BMI, Medication, Note) now has a "Delete" link above
  the update button, with an inline "Delete this entry? / Cancel"
  confirmation step before anything is actually removed. Previously
  there was no way to undo a mis-logged entry short of editing it
  into something else.

## 1.3.3

- Added a "Mark as taken" quick-log button to each medication's status
  badge (Notes & Meds tab) - one tap logs a new dose reusing the same
  name/dosage/unit/interval as the last one, timestamped now, instead
  of opening the full form.
- The "next dose due" badge now shows how late a dose is ("Overdue by
  3h 20m") and which day the next one is due ("Next: Tomorrow at
  19:00") instead of just a bare time with no date context.
- Added a way to manually set the next dose time (clock icon next to
  the badge) - pick a date/time and it recalculates the underlying
  interval on the last logged dose accordingly.
- Added a 30-day Medication Log (date-range selectable, CSV export)
  under the Medications card, so you can review or export what was
  actually given over time.

## 1.3.2

- Fixed the Feedings card on Overview showing the count twice (big
  number "9" plus a redundant "9 today" line below it). Now shows
  "9 Today" as the headline value and "Last: 1h 59m ago" underneath.

## 1.3.1

- Split the single "Daily Report" into two focused reports: "Daily
  Report — Growth" (feeding, diaper, sleep, tummy time) and "Daily
  Report — Measure" (weight, height, head circumference, BMI).
  Weight/Height/Head Circ./BMI stat cards now open the Measure
  report instead of a report that never included their own data.
- Added an "Avg Diapers" stat card to the Growth tab, matching the
  existing Avg Feeding/Avg Sleep cards.
- Fixed a mobile layout bug where the quick-stat grid rendered 1 or 2
  columns inconsistently depending on the exact phone width (e.g.
  iPhone 12 vs iPhone 16, both ~390px, would render differently).
  It's now a fixed 2-column layout on mobile regardless of device.
- Added BMI, head circumference, and medication tracking, backed by
  Baby Buddy's existing `/api/bmi/`, `/api/head-circumference/`, and
  `/api/medication/` endpoints. New FAB actions, Growth tab trend
  charts, and a combined "Notes & Meds" tab with a Medications card
  showing recent doses and a "next dose due" / "overdue" indicator.
- Feeding charts (Overview weekly, Growth 30-day) now show feeding
  count alongside amount, with a settings toggle to pick which
  metric(s) to display.
- Fixed forms failing silently on a network error - a failed save
  now shows an inline error banner and logs to a small, exportable
  error log (new header button with an unread-count badge).
- Fixed `timeAgo()` truncating to whole hours/days (e.g. "1h ago" for
  anything between 60-119 minutes); now shows "1h 32m ago".
- Fixed the Report view failing when Demo Mode is enabled - it now
  builds report rows from the bundled demo data instead of calling
  the (nonexistent, in demo mode) live API.
- Accessibility: added `aria-label`s to icon-only buttons and
  keyboard support (Enter/Space) to click-to-edit rows and cards.
- Hardened the backend's static file path check against path
  traversal.

## 1.2.9

- Fixed the quick-stat and section-card grids collapsing to a single
  column on phone-width screens instead of keeping a readable
  multi-column layout.
