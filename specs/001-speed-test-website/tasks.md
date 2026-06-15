# Tasks: Network Speed Test Website

**Input**: Design documents from `/specs/001-speed-test-website/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: Not explicitly requested in spec.md; one polish task (T025) covers the `node --test` API contract tests called out in plan.md's Testing section.

**Organization**: Tasks are grouped by user story (US1/US2/US3, per spec.md priorities P1/P2/P3) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- File paths are relative to the repo root (`speedtest/`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization matching sibling-project conventions (flat repo, Express, no build step)

- [ ] T001 Create flat project skeleton (empty `index.html`, `style.css`, `app.js`, `server.js`) at repo root per plan.md Project Structure
- [ ] T002 Initialize `package.json` (Express ^4.19.2 dependency, `"start": "node server.js"`, Node 20 engines field) and run `npm install`
- [ ] T003 [P] Add `.gitignore`, `.prettierrc`, `.prettierignore` matching `LostCities/` conventions

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core server and page scaffolding that every user story builds on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 In `server.js`, create the Express app: `app.set('trust proxy', true)`, `app.use(express.static(__dirname))`, listen on `process.env.PORT || 8082`
- [ ] T005 [P] In `index.html`, create the single-page skeleton: start button, phase indicator placeholder, live numbers placeholder, results panel placeholder, link `style.css` and `app.js`
- [ ] T006 [P] In `style.css`, set up base responsive layout (mobile-first, 320px+ widths, no horizontal scroll) for the elements defined in `index.html`
- [ ] T007 [P] In `app.js`, scaffold the test-orchestration module: state object for current results, DOM references, and a `startTest()` entry point wired to the start button
- [ ] T008 Implement `GET /api/ping` in `server.js` returning `204 No Content` with `Cache-Control: no-store`, per `contracts/api.md`

**Checkpoint**: Server starts, serves the static page, and responds to `/api/ping` — foundation ready for user story work

---

## Phase 3: User Story 1 - Run a speed test (Priority: P1) 🎯 MVP

**Goal**: Visitor runs a test and sees download Mbps, upload Mbps, and ping ms; re-running replaces prior results; layout works on mobile.

**Independent Test**: Open the site, start a test, confirm download/upload/ping values appear at the end; start again and confirm values are replaced; verify layout at 320px width.

### Implementation for User Story 1

- [ ] T009 [P] [US1] Implement `GET /api/download?bytes=N` in `server.js`: clamp `bytes` (min 64KB, max 25MB), stream a generated buffer with `Content-Length` set and `Cache-Control: no-store`, no `Content-Encoding`, per `contracts/api.md`
- [ ] T010 [P] [US1] Implement `POST /api/upload` in `server.js`: consume the `application/octet-stream` body, count bytes received, respond `200` with `{ "bytesReceived": <number> }` and `Cache-Control: no-store`, per `contracts/api.md`
- [ ] T011 [US1] In `app.js`, implement ping measurement: 5 sequential `fetch('/api/ping')` calls, discard the first, report the median round-trip in ms
- [ ] T012 [US1] In `app.js`, implement download measurement: `fetch('/api/download?bytes=...')`, read via `response.body.getReader()`, compute Mbps from bytes read over elapsed time
- [ ] T013 [US1] In `app.js`, implement upload measurement: generate a Blob/ArrayBuffer of fixed size, send via `XMLHttpRequest` `POST /api/upload`, compute Mbps from bytes sent over elapsed time
- [ ] T014 [US1] In `app.js`, implement `startTest()` orchestration: run ping → download → upload in sequence, store final values in the results state object
- [ ] T015 [US1] In `index.html`/`app.js`, render the results panel (download Mbps, upload Mbps, ping ms) once `startTest()` completes
- [ ] T016 [US1] In `app.js`, ensure starting a new test resets/clears the previous results panel before showing new values (re-run replaces prior results)
- [ ] T017 [US1] In `style.css`, finalize responsive styling for the results panel and controls across 320px–desktop widths, verifying no horizontal scroll
- [ ] T018 [US1] In `app.js`/`index.html`, add an error/retry state: on any fetch/XHR failure during ping, download, or upload, show a clear error message with a retry action (FR-008)

**Checkpoint**: User Story 1 is fully functional and independently testable — full speed test runs end to end with results display and error handling

---

## Phase 4: User Story 2 - Watch live progress during the test (Priority: P2)

**Goal**: While download/upload phases run, the UI updates at least once per second and clearly indicates the active phase.

**Independent Test**: Start a test and confirm the displayed value updates continuously (not just at the end) during download and upload, and that the active phase is visibly indicated.

### Implementation for User Story 2

- [ ] T019 [US2] In `app.js`, extend the download measurement (T012) to emit incremental throughput readings at least once per second while reading the response stream
- [ ] T020 [US2] In `app.js`, extend the upload measurement (T013) to emit incremental throughput readings at least once per second via `xhr.upload.onprogress`
- [ ] T021 [US2] In `index.html`/`app.js`, add a phase indicator (ping / download / upload / done) that updates as `startTest()` (T014) progresses through phases
- [ ] T022 [US2] In `index.html`/`app.js`/`style.css`, bind the live throughput readings (T019, T020) to a live-updating number/gauge element, styled for smooth updates

**Checkpoint**: User Stories 1 AND 2 both work independently — live progress is visible during download and upload phases

---

## Phase 5: User Story 3 - View connection details alongside results (Priority: P3)

**Goal**: After a test, the visitor sees their public IP address and the test server's identity/location.

**Independent Test**: Run a test and confirm the results view shows the client's public IP and the server name/location.

### Implementation for User Story 3

- [ ] T023 [P] [US3] Implement `GET /api/ip` in `server.js`: return `200` JSON `{ "ip": req.ip, "server": "<static label/env var>" }` with `Cache-Control: no-store`, per `contracts/api.md`
- [ ] T024 [US3] In `app.js`/`index.html`, fetch `/api/ip` when a test completes and display `ip` and `server` alongside the results panel (T015)

**Checkpoint**: All user stories are independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Project-level documentation, licensing, and final validation

- [ ] T025 [P] Add `node --test` contract tests for `/api/ping`, `/api/download`, `/api/upload`, `/api/ip` in `test/api.test.js`, per `contracts/api.md`
- [ ] T026 Write `README.md` with project description, setup (`npm install`, `npm start`), and usage instructions
- [ ] T027 [P] Add `LICENSE` (MIT), matching sibling-project licensing
- [ ] T028 [P] Write `CONTRIBUTING.md` with local setup and contribution guidelines
- [ ] T029 Run through `quickstart.md` end-to-end (all three user stories, edge cases: network failure mid-test, reload mid-test, 320px layout)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational only — MVP
- **User Story 2 (Phase 4)**: Depends on Foundational; extends US1's measurement functions (T012, T013, T014) in place, so implement after US1
- **User Story 3 (Phase 5)**: Depends on Foundational only — independent of US1/US2, but slots into the results panel built in T015
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### Within Each User Story

- Server endpoints ([P]-marked) can be built alongside or before client measurement code
- Measurement functions before orchestration (T014 depends on T011-T013)
- Orchestration before results display (T015 depends on T014)
- Story implementation before its error/edge-case handling (T018 depends on T011-T014)

### Parallel Opportunities

- T003 can run alongside T002
- T005, T006, T007 (different files) can run in parallel once T004 exists
- T009 and T010 (different endpoints, same file but independent handlers) can be developed in parallel
- T023 can be implemented any time after Phase 2, in parallel with US1/US2 work
- T025, T027, T028 can run in parallel during Polish

---

## Parallel Example: Phase 2 Foundational

```bash
# After T004 (server.js base) is done, these can proceed together:
Task: "Create index.html skeleton"
Task: "Create base style.css layout"
Task: "Scaffold app.js orchestration module"
```

## Parallel Example: User Story 1

```bash
# Server endpoints can be built in parallel:
Task: "Implement GET /api/download in server.js"
Task: "Implement POST /api/upload in server.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (T009-T018)
4. **STOP and VALIDATE**: Run `quickstart.md` User Story 1 steps — full test completes with results and error handling
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → server runs, page loads, `/api/ping` works
2. User Story 1 → full speed test with results (MVP)
3. User Story 2 → live progress during download/upload
4. User Story 3 → IP + server identity shown with results
5. Polish → docs, license, contributing guide, full quickstart validation
