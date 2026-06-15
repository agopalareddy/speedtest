# Implementation Plan: Network Speed Test Website

**Branch**: `001-speed-test-website` | **Date**: 2026-06-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-speed-test-website/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

A single-page website where a visitor runs an in-browser test that measures download speed, upload speed, and ping against this project's own server, with live-updating numbers during the run and a results view showing the visitor's public IP and the server location. Built as a small Node.js/Express app (matching the flat structure of sibling projects in this workspace) that serves a static frontend and exposes a few lightweight HTTP endpoints used by the frontend's measurement logic.

## Technical Context

**Language/Version**: Node.js 20 (JavaScript/ES2022) backend; vanilla HTML/CSS/JS frontend (no build step)

**Primary Dependencies**: Express 4 (static file serving + measurement API endpoints). No frontend framework — matches the no-build-step pattern used by sibling projects (e.g. landing page, LostCities).

**Storage**: N/A — no database, no server-side persistence. Each test result exists only in the visitor's browser for the duration of their session.

**Testing**: Node.js built-in test runner (`node --test`) for the API endpoints (download/upload/ping/ip contracts); manual browser walkthrough via quickstart.md for the end-to-end UI flows.

**Target Platform**: Linux server (existing `gcp-showcase` GCP host) behind Nginx + PM2, per `AGENTS.md` deployment conventions; modern desktop and mobile browsers (Chrome, Firefox, Safari, Edge — current and previous major version).

**Project Type**: Single small web application — one Express server serving a static frontend and a handful of API endpoints, following the flat repo layout used by sibling projects (`server.js` + static assets at repo root).

**Performance Goals**: Full test (download + upload + ping) completes in under 30s on a typical broadband connection (SC-001); live readings update at least once per second during transfer phases (FR-004); reported speeds within 15% of an established third-party tool (SC-002).

**Constraints**: No accounts/auth/login; single test server/location (no multi-region selection); results not persisted server-side; must run entirely over plain HTTP(S) requests (no WebSocket/WebRTC) so it works through Nginx and typical browser/extension setups; download/upload payloads must bypass HTTP compression and caching so measured throughput reflects real transfer size.

**Scale/Scope**: Personal/portfolio-scale traffic (occasional visitors), single page, ~4 API endpoints, no multi-tenant concerns.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is the unfilled project template (no ratified principles for this repo). There are no project-specific constitution gates to evaluate. No violations to track.

## Project Structure

### Documentation (this feature)

```text
specs/001-speed-test-website/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
speedtest/
├── server.js            # Express app: static hosting + /api/ping, /api/download, /api/upload, /api/ip
├── index.html           # Single-page UI: start button, live gauge/numbers, results panel
├── style.css            # Responsive layout (320px+ widths, no horizontal scroll)
├── app.js               # Frontend test orchestration: download/upload/ping measurement, live UI updates
├── package.json
├── README.md
├── LICENSE
└── CONTRIBUTING.md
```

**Structure Decision**: Single flat Node.js/Express project at the repo root, matching the structure of sibling projects (`LostCities/`, `CS340Final-Connect4/`) — `server.js` plus static `index.html`/`style.css`/`app.js` served directly via `express.static`. No `frontend/`/`backend/` split: the "frontend" is static assets served by the same small server, so a separate project would add deployment complexity (a second PM2 process, a second Nginx route) without benefit at this scale.

## Complexity Tracking

> No constitution violations — section not needed.
