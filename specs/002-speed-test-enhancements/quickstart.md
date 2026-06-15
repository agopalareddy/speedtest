# Quickstart: Validating Speed Test Enhancements

## Prerequisites

- Node.js 20+
- From repo root: `npm install` (or `pnpm install`)

## Run

```bash
npm start
```

Open `http://localhost:8082` (or `$PORT`).

## Validation scenarios

1. **Accuracy (US1 / FR-001, FR-002 / SC-001)**
   - Click "Start Test" three times in a row (use "Retry" after each).
   - Confirm reported download/upload Mbps vary by less than ~10% between runs.
   - Confirm the results show both a ping value and a separate jitter value.

2. **Gauge + quality summary (US2 / FR-003, FR-004)**
   - During the Download and Upload phases, confirm the gauge needle moves live alongside the numeric reading (≥1 update/sec).
   - After completion, confirm a plain-language quality label appears (e.g., "4K streaming & video calls") matching the tier for the measured download speed (see research.md).

3. **History (US3 / FR-005, FR-006, SC-002)**
   - Run the test twice via "Retry".
   - Confirm both results are visible: latest as the primary card, the prior run listed below in a history list.
   - Reload the page; confirm the history list is empty and only the idle state is shown.

4. **Design language (US4 / FR-007, SC-003)**
   - Open this page next to `personal-website` or `LostCities`.
   - Confirm: light background, navy (#1e3a8a) accent on the start/retry buttons, `Lora` heading font on the `<h1>`, and the results section rendered as a rounded card matching the sibling sites' `--radius-md`/`--radius-lg` and spacing tokens.

5. **Regression (FR-008)**
   - Confirm idle → ping → download → upload → done phase labels still appear in order, and that disconnecting mid-test (or throttling) still surfaces the existing error message with a working "Retry" button.

## Automated checks

No new server endpoints were added, so existing `node --test` server tests remain the regression check:

```bash
npm test
```
