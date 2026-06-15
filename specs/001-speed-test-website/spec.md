# Feature Specification: Network Speed Test Website

**Feature Branch**: `001-speed-test-website`

**Created**: 2026-06-14

**Status**: Draft

**Input**: User description: "I want to create a simple website that helps me test my network speed. the parent folder GCP_Projects contains more folders and documentation on where this project needs to go. Please help me create this website and deploy it on github (we need to create a new repo) with good documentation, licensing, and contributing guidelines, and then deploy to gcp."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Run a speed test (Priority: P1)

A visitor opens the website and runs a test of their internet connection, seeing their download speed, upload speed, and ping (latency) measured against the hosting server.

**Why this priority**: This is the core purpose of the site. Without it, there is no product.

**Independent Test**: Open the site, start a test, and confirm download Mbps, upload Mbps, and ping ms values are displayed at the end of the run. Delivers the full core value on its own.

**Acceptance Scenarios**:

1. **Given** a visitor on the homepage, **When** they start a test, **Then** the site measures and displays download speed, upload speed, and ping in standard units (Mbps, ms).
2. **Given** a completed test, **When** the visitor starts a new test, **Then** the previous results are replaced with a fresh measurement.
3. **Given** a visitor on a mobile device, **When** they run a test, **Then** the layout and results remain fully readable and usable without horizontal scrolling.

---

### User Story 2 - Watch live progress during the test (Priority: P2)

While a test is running, the visitor sees real-time feedback (a moving gauge or live numbers) so the site doesn't feel frozen or broken during the 10-30 second measurement.

**Why this priority**: Builds trust that the test is working and matches the experience users expect from established speed test tools.

**Independent Test**: Start a test and confirm the displayed speed value updates continuously (not just at the end) during the download and upload phases.

**Acceptance Scenarios**:

1. **Given** a test in progress, **When** the download phase is measuring, **Then** the displayed value updates at least once per second to reflect current throughput.
2. **Given** a test in progress, **When** the phase switches from download to upload, **Then** the UI clearly indicates which phase is active.

---

### User Story 3 - View connection details alongside results (Priority: P3)

After a test, the visitor sees supplementary info about their connection: their public IP address and which server they were tested against.

**Why this priority**: Useful context that helps users interpret results (e.g., confirm they're testing the connection they think they are), but not essential to the core measurement.

**Independent Test**: Run a test and confirm the results view shows the client's public IP address and the test server's identity/location, independent of whether this info is shown before the test starts.

**Acceptance Scenarios**:

1. **Given** a completed test, **When** results are displayed, **Then** the visitor's public IP address and the test server location/name are shown alongside the speed results.

---

### Edge Cases

- What happens when the visitor's connection drops or times out mid-test? Site MUST show a clear error/retry state instead of hanging indefinitely or showing a misleading partial result.
- What happens when the connection is extremely slow (e.g., dial-up speeds)? Test MUST still complete (possibly capped at a maximum duration) and report an accurate low value rather than failing.
- What happens when multiple visitors run tests at the same time? Each visitor's measurement MUST reflect their own connection, not be skewed by concurrent load beyond what the host server can handle.
- How does the site behave if the browser blocks the required network requests (e.g., privacy extensions, ad blockers)? Site MUST show a clear message explaining the test could not run.
- What happens on a page reload mid-test? The in-progress test is simply abandoned; no partial result is saved.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST measure download speed by transferring data from the server to the visitor's browser and reporting throughput in Mbps.
- **FR-002**: System MUST measure upload speed by transferring data from the visitor's browser to the server and reporting throughput in Mbps.
- **FR-003**: System MUST measure latency (ping) to the server in milliseconds.
- **FR-004**: System MUST display live, continuously-updating speed readings while a test is in progress (FR-001/FR-002 phases).
- **FR-005**: Users MUST be able to start a new test on demand, including re-running immediately after a completed test.
- **FR-006**: System MUST display the visitor's public IP address and the test server's identity/location after a test completes.
- **FR-007**: System MUST work in modern desktop and mobile browsers without requiring any install, plugin, or account.
- **FR-008**: System MUST present a clear error state if a test cannot start or fails partway through, with the option to retry.
- **FR-009**: System MUST be presentable as a standalone open-source project: a public GitHub repository containing the website source, a README with setup/usage instructions, an open-source license, and a CONTRIBUTING guide.
- **FR-010**: System MUST be reachable as a live website once deployed, following this workspace's existing GCP hosting conventions (see `AGENTS.md`).

### Key Entities

- **Speed Test Result**: A single test run's outcome — download Mbps, upload Mbps, ping ms, timestamp, and the server used. Exists only for the duration of the visitor's session (not persisted server-side).
- **Client Connection Info**: The visitor's public IP address and approximate test-server location/name, shown alongside results for context.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A visitor can go from page load to seeing complete download, upload, and ping results in under 30 seconds on a typical broadband connection.
- **SC-002**: Reported download and upload speeds are within 15% of results from an established third-party speed test tool on the same connection at the same time.
- **SC-003**: The site is usable (no layout breakage, no horizontal scrolling) on screen widths from 320px to standard desktop resolutions.
- **SC-004**: At least 95% of test runs on a stable connection complete without an error/retry being shown.
- **SC-005**: The project repository includes a README, LICENSE, and CONTRIBUTING file sufficient for a new contributor to set up the project locally without asking the maintainer questions.

## Assumptions

- A single test server (the project's existing GCP host, per `AGENTS.md` deployment conventions) is used as the origin/destination for all measurements; no multi-location server selection is offered.
- No user accounts, login, or cross-session history — each visit is a fresh, anonymous session, and results are not stored after the page is closed.
- The site is public and requires no authentication to use.
- Browser-based only; no native mobile apps.
- The new GitHub repository will be created under the same GitHub account/organization used for the other projects referenced in `AGENTS.md` (`agopalareddy/*`).
- Licensing follows the same open-source license style already used by sibling projects in this workspace (MIT), unless specified otherwise during planning.
