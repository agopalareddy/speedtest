# Feature Specification: Speed Test Enhancements

**Feature Branch**: `002-speed-test-enhancements`

**Created**: 2026-06-15

**Status**: Draft

**Input**: User description: "I need this to be more feature rich, accurate, and aligned with the design language of the rest of my website."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Trustworthy, accurate results (Priority: P1)

A visitor runs the test and gets numbers they can trust — the test takes multiple measurements, reports a stable result instead of one noisy sample, and shows ping jitter alongside ping so they understand connection consistency.

**Why this priority**: Accuracy is the core value proposition of a speed test; an inaccurate or jumpy result undermines the whole site.

**Independent Test**: Run the test on a known connection and verify the reported download/upload/ping/jitter values are stable across repeated runs and consistent with a third-party tool within 15%.

**Acceptance Scenarios**:

1. **Given** the visitor clicks "Start Test", **When** the download phase runs, **Then** the system performs multiple timed transfers and reports a result derived from them (not a single sample).
2. **Given** the test completes, **When** results are shown, **Then** ping jitter (variation between ping samples) is displayed alongside the average ping.

---

### User Story 2 - Richer results detail (Priority: P2)

A visitor sees a results view with a visual speed gauge during the test, a breakdown of download/upload/ping/jitter, their IP, server location, and a connection quality summary (e.g., "Good for video calls").

**Why this priority**: Makes the result more useful and engaging than raw numbers, increasing perceived value of the site.

**Independent Test**: Run a test and confirm the gauge animates with live readings during transfer phases, and the final results card shows all listed fields plus a plain-language quality summary.

**Acceptance Scenarios**:

1. **Given** the download or upload phase is running, **When** live readings update, **Then** a visual gauge/needle reflects the current reading in addition to the numeric value.
2. **Given** the test completes, **When** results are displayed, **Then** a plain-language summary classifies the connection (e.g., "Great for 4K streaming", "OK for browsing") based on the measured download speed.

---

### User Story 3 - Result history within session (Priority: P3)

A visitor who runs the test multiple times in one visit can see their previous results listed below the current one, so they can compare runs without losing earlier data.

**Why this priority**: Adds repeat-use value without requiring accounts or server-side storage.

**Independent Test**: Run the test twice and confirm both results appear in a history list, most recent first, cleared on page reload.

**Acceptance Scenarios**:

1. **Given** the visitor has completed one test, **When** they click "Retry" and complete a second test, **Then** both results are visible — the latest as the primary result and the prior one in a history list below.
2. **Given** the visitor reloads the page, **When** the page loads, **Then** the history list is empty (no server-side persistence).

---

### User Story 4 - Consistent site design language (Priority: P2)

A visitor arriving from the rest of the portfolio site (agreddy.com / LostCities) experiences a matching visual style — light theme, navy accent color, same fonts, card-based layout with consistent spacing/radius — rather than the current standalone dark page.

**Why this priority**: Visual consistency across the portfolio is part of the user's brand; the current dark theme clashes with sibling projects.

**Independent Test**: Compare the rendered page side-by-side with LostCities/personal site — fonts, colors (navy accent, light background), border radius, and spacing should visibly match.

**Acceptance Scenarios**:

1. **Given** the page loads, **When** rendered, **Then** it uses a light background, navy accent color, and the same heading/body font families as the sibling sites.
2. **Given** the results section is shown, **When** rendered, **Then** it appears as a card with rounded corners and spacing consistent with the sibling sites' design tokens.

---

### Edge Cases

- What happens if the visitor's connection drops mid-test? The current phase shows an error and offers "Retry" (existing behavior, preserved).
- What if a visitor runs the test on a very slow connection where multiple samples would take too long? The system caps total test duration (per existing 30s target) by limiting sample count/size accordingly.
- What if the browser window is resized to mobile width during a test? The gauge and layout must remain usable on small screens (existing responsive behavior, extended to new elements).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST take multiple timed samples for download and upload (not a single transfer) and report an aggregated value (e.g., median) for improved accuracy.
- **FR-002**: System MUST take multiple ping samples and report both average ping and jitter (variation between samples).
- **FR-003**: System MUST display a visual gauge that updates live during download and upload phases, reflecting the current reading.
- **FR-004**: System MUST display a plain-language connection quality summary based on the measured download speed (e.g., browsing/streaming/4K/gaming tiers).
- **FR-005**: System MUST retain completed test results from the current browser session and display them as a history list below the current result, most recent first.
- **FR-006**: System MUST clear result history on page reload (no server-side persistence, consistent with existing constraints).
- **FR-007**: System MUST restyle the page (colors, fonts, spacing, border radius, card layout) to match the design tokens used by sibling portfolio projects (light theme, navy accent, Lora/system body fonts).
- **FR-008**: System MUST preserve existing functional behavior (start/retry buttons, error handling, idle/phase states, IP and server display) while applying the new design and features.

### Key Entities

- **Test Result**: A completed run's data — download Mbps, upload Mbps, ping ms, jitter ms, visitor IP, server location, timestamp, quality summary label.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Reported download/upload speeds vary by less than 10% across three consecutive runs on the same stable connection (improved from single-sample variance).
- **SC-002**: Visitors can view a history of all tests run during their visit without reloading the page.
- **SC-003**: The page's visual style (colors, fonts, layout) is indistinguishable in tone from the sibling portfolio projects when viewed side-by-side.
- **SC-004**: The full test (download + upload + ping) still completes in under 30 seconds on a typical broadband connection.

## Assumptions

- "Design language of the rest of my website" refers to the personal portfolio site and LostCities project's light theme, navy (#1e3a8a) accent, Lora/system fonts, and card/radius/spacing tokens.
- Result history is kept in memory/sessionStorage only — no backend changes for persistence.
- Connection quality tiers use common thresholds (e.g., <5 Mbps browsing, 5-25 streaming, 25-100 4K/multi-device, 100+ gaming/heavy use) — exact thresholds are an implementation detail for the planning phase.
- No new external dependencies are introduced; gauge and styling are implemented with vanilla HTML/CSS/JS/SVG, consistent with the existing no-build-step approach.
