# Research: Speed Test Enhancements

No NEEDS CLARIFICATION markers remain in the spec or technical context — all decisions below use existing project conventions, so dedicated research tasks were not needed.

## Decision: Multi-sample measurement strategy

- **Decision**: Download and upload each run as 3 sequential transfers; report the median Mbps. Ping runs 7 samples (vs. current 5), discard the first (warm-up), report median as ping and (max-min) of the remainder as jitter.
- **Rationale**: Median is robust to one-off network blips without adding new dependencies or server endpoints; matches SC-001 (<10% variance across runs) and keeps total test time within the existing 30s budget (SC-004) since transfer sizes stay the same order of magnitude.
- **Alternatives considered**: Mean (more sensitive to outliers); increasing single-transfer size only (doesn't address transient jitter); server-side aggregation (would require new endpoint — rejected, no backend changes needed).

## Decision: Live gauge implementation

- **Decision**: Inline SVG arc with a rotating needle `<g>`, updated via `transform: rotate()` on the existing `setLive()` callback path.
- **Rationale**: No new dependency, scales with CSS, matches "vanilla, no-build-step" constraint (FR-003).
- **Alternatives considered**: `<canvas>` (more code for an equivalent static-arc gauge); a charting library (new dependency — rejected).

## Decision: Connection quality tiers

- **Decision**: Classify by download Mbps: <5 "Browsing & email", 5–25 "HD streaming", 25–100 "4K streaming & video calls", 100+ "Gaming & heavy multi-device use".
- **Rationale**: Matches common ISP/industry tier language (FCC broadband definitions ballpark), technology-agnostic per spec Assumptions.
- **Alternatives considered**: Combining upload/ping into the score — rejected as over-scoping for FR-004, which is download-based by spec.

## Decision: Session history storage

- **Decision**: `sessionStorage` array of completed `Test Result` objects, rendered as a simple list under the results card; cleared automatically on reload since `sessionStorage` is tab-scoped (satisfies FR-006 without explicit clear code).
- **Rationale**: Simplest mechanism meeting "no server persistence" + "cleared on reload" requirements.
- **Alternatives considered**: In-memory array only (lost on any re-render, slightly more fragile than sessionStorage for no benefit); `localStorage` (persists across reloads — violates FR-006).

## Decision: Design tokens to adopt

- **Decision**: Adopt LostCities' light theme tokens: `--bg-base: #f8fafc`, `--bg-surface: #ffffff`, `--text-primary: #0f172a`, `--text-secondary: #475569`, `--accent: #1e3a8a` (navy), `--accent-hover: #1e40af`, `--accent-soft: #eff6ff`, `--border-color: #e2e8f0`, `--radius-md: 8px`/`--radius-lg: 12px`, `--font-heading: 'Lora', 'Cambria', 'Georgia', serif`, body font system stack (existing).
- **Rationale**: Directly satisfies FR-007/SC-003 by reusing the exact tokens already in use on the sibling site, loaded via the same Google Fonts approach as personal-website.
- **Alternatives considered**: Inventing new tokens — rejected, defeats the consistency goal.
