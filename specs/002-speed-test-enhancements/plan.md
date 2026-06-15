# Implementation Plan: Speed Test Enhancements

**Branch**: `002-speed-test-enhancements` | **Date**: 2026-06-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-speed-test-enhancements/spec.md`

## Summary

Rework the existing single-page speed test (download, upload, ping) to take multiple samples for accuracy (median download/upload, average ping + jitter), add a live SVG gauge and a plain-language connection-quality summary, keep an in-session (sessionStorage) history of past runs on the page, and restyle the page to match the sibling portfolio sites' light theme / navy accent / Lora heading font / card layout. All changes are frontend-only (`index.html`, `style.css`, `app.js`); no new endpoints or dependencies.

## Technical Context

**Language/Version**: Node.js 20 (Express server, unchanged); vanilla HTML/CSS/JS frontend (no build step)

**Primary Dependencies**: None new. Express 5 (existing). Gauge rendered with inline SVG; fonts via existing `Lora`/system stack pattern used by sibling sites (loaded via Google Fonts `<link>`, same as personal-website).

**Storage**: `sessionStorage` for in-page result history (cleared on reload per FR-006/SC-002) — no backend persistence.

**Testing**: Node.js built-in test runner (`node --test`) for any server-side contract changes (none expected); manual browser walkthrough via quickstart.md for gauge, history, styling, and accuracy behavior.

**Target Platform**: Linux server (existing `gcp-showcase` host) behind Nginx/PM2; modern desktop and mobile browsers.

**Project Type**: Single small web application (existing flat layout: `server.js` + static assets at repo root) — no structural change.

**Performance Goals**: Full test still completes in under 30s (SC-004); gauge updates at the existing ≥1/s live-reading cadence (FR-003).

**Constraints**: No new dependencies, no build step, no accounts/persistence beyond sessionStorage, must keep existing `/api/*` contract (download/upload/ping/ip endpoints unchanged) since FR-008 requires preserving existing behavior.

**Scale/Scope**: Same as existing — personal/portfolio-scale traffic, single page, same 4 API endpoints, frontend-only enhancement.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is the unfilled project template (no ratified principles for this repo). No project-specific gates apply. No violations to track.

## Project Structure

### Documentation (this feature)

```text
specs/002-speed-test-enhancements/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
# Existing flat layout — no new directories
index.html   # add gauge markup, quality summary, history list, font links
style.css    # restyle to light/navy/Lora design tokens; gauge + history styles
app.js       # multi-sample download/upload, ping jitter, gauge updates,
             # quality classification, sessionStorage history
server.js    # unchanged
```

**Structure Decision**: Keep the existing flat single-app layout (no `frontend/`/`backend/` split, no new dependencies). All work is additive edits to the three existing static files, matching the "no-build-step, flat repo" pattern shared with sibling projects.

## Complexity Tracking

*No violations — table omitted.*
