# Tasks: Speed Test Enhancements

**Input**: Design documents from `/specs/002-speed-test-enhancements/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not requested in the spec — quickstart.md manual walkthrough is the validation mechanism; `npm test` (existing `node --test` server tests) is the regression check.

**Organization**: All work is on the existing flat files (`index.html`, `style.css`, `app.js`). Because every story touches these same three files, most tasks are sequential (no `[P]`) even though they map to independent user stories.

## Phase 1: Setup

- [X] T001 Add Google Fonts `<link>` for `Lora` to `index.html` `<head>`, matching the pattern used in `../personal-website/index.html` (no new npm dependency).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the shared design tokens and base layout that every user story's markup will use.

- [X] T002 In `style.css`, replace the existing dark-theme rules with CSS custom properties matching `../LostCities/style.css`: `--bg-base: #f8fafc`, `--bg-surface: #ffffff`, `--text-primary: #0f172a`, `--text-secondary: #475569`, `--accent: #1e3a8a`, `--accent-hover: #1e40af`, `--accent-soft: #eff6ff`, `--border-color: #e2e8f0`, `--radius-md: 8px`, `--radius-lg: 12px`, `--font-heading: 'Lora', 'Cambria', 'Georgia', serif`, and apply them to `body`, `h1`, and `button` (FR-007).
- [X] T003 In `style.css`, restyle `#results` (and add a shared `.card` class) to use `var(--bg-surface)`, `var(--border-color)`, `var(--radius-lg)`, and consistent padding/spacing so it reads as a card (FR-007).

**Checkpoint**: Page renders in the new light/navy/Lora theme with no behavioral change yet.

---

## Phase 3: User Story 1 - Trustworthy, accurate results (Priority: P1) 🎯 MVP

**Goal**: Multi-sample download/upload (median) and ping jitter, surfaced in the results card.

**Independent Test**: Run the test 3x; download/upload vary <10% run-to-run; results show both ping and jitter.

- [X] T004 [US1] In `app.js`, refactor `measureDownload` into a function that performs `DOWNLOAD_SAMPLES` (3) sequential timed transfers and returns each sample's Mbps; set `state.downloadMbps` to the median of the samples (FR-001).
- [X] T005 [US1] In `app.js`, refactor `measureUpload` the same way for upload samples, setting `state.uploadMbps` to the median (FR-001).
- [X] T006 [US1] In `app.js`, increase `PING_COUNT` to 7, keep the warm-up discard, set `state.pingMs` to the median of the remaining samples, and set `state.jitterMs` to `max - min` of those samples (FR-002).
- [X] T007 [US1] In `index.html`, add a `<dt>Jitter</dt><dd><span data-field="jitter"></span> ms</dd>` row inside `#results dl`; in `app.js` `showResults`, populate it from `state.jitterMs.toFixed(0)` (FR-002).

**Checkpoint**: Accuracy + jitter delivered; page is independently testable/demoable.

---

## Phase 4: User Story 2 - Richer results detail (Priority: P2)

**Goal**: Live SVG gauge during transfer phases, plus a plain-language connection-quality summary.

**Independent Test**: During download/upload the gauge needle moves with live readings; on completion a quality label appears matching the download tier.

- [X] T008 [US2] In `index.html`, add an inline SVG gauge (arc + needle `<g id="gauge-needle">`) above `#live-reading`.
- [X] T009 [US2] In `style.css`, add gauge styles (size, arc stroke, needle `transition: transform`, centered layout) consistent with the card/spacing tokens from T002/T003.
- [X] T010 [US2] In `app.js`, add a `setGauge(mbps)` helper that maps an Mbps value to a needle rotation angle (capping at a max scale, e.g. 200 Mbps) and call it from the existing download/upload progress callbacks alongside `setLive()` (FR-003).
- [X] T011 [US2] In `app.js`, add a `qualityLabel(downloadMbps)` function implementing the tiers from `research.md` (<5 "Browsing & email", 5–25 "HD streaming", 25–100 "4K streaming & video calls", 100+ "Gaming & heavy multi-device use"); in `index.html` add a `<p id="quality"></p>` under `#results`, and populate it in `showResults` (FR-004).

**Checkpoint**: Gauge + quality summary live; independently demoable on top of US1.

---

## Phase 5: User Story 3 - Result history within session (Priority: P3)

**Goal**: Show prior results from the current session below the current result.

**Independent Test**: Run the test twice via Retry; both results visible (latest as primary, prior in history list); reload clears history.

- [X] T012 [US3] In `index.html`, add `<section id="history"><h2>Previous results</h2><ul id="history-list"></ul></section>` after `#results`.
- [X] T013 [US3] In `style.css`, style `#history` and `#history-list` items as compact rows consistent with the card styling from T003.
- [X] T014 [US3] In `app.js`, on test completion build a `Test Result` object (per `data-model.md`: download/upload/ping/jitter/ip/server/qualityLabel/timestamp), read/append it to a `sessionStorage` array under key `speedtest.history`, and render all *prior* entries (most recent first) into `#history-list` (FR-005, FR-006).

**Checkpoint**: All three priority stories functional; full feature set complete.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T015 Run `quickstart.md` end-to-end (all 5 validation scenarios) and fix any visual/behavioral regressions found.
- [X] T016 Run `npm test` to confirm existing server-side tests still pass (no server changes expected).

---

## Dependencies & Execution Order

- **Setup (T001)** → **Foundational (T002-T003)** → User Stories (T004-T014) → **Polish (T015-T016)**.
- US1 (T004-T007), US2 (T008-T011), US3 (T012-T014) are logically independent but edit the same three files, so implement sequentially in priority order (P1 → P2 → P3) to avoid merge conflicts; each checkpoint leaves the page in a fully working state.

## Implementation Strategy

**MVP** = Setup + Foundational + Phase 3 (US1): restyled page with accurate multi-sample download/upload and ping jitter. Add US2 (gauge + quality) and US3 (history) incrementally, validating with `quickstart.md` after each.
