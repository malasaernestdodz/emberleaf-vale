# e2e-verification Specification

## ADDED Requirements

### Requirement: Runtime probe contract

The app SHALL expose `window.__Ghibli.snapshot()` returning plain JSON: ready,
player x/y/z + house-local lx/lz, heading, camYaw/camPitch/camDist/camX/Y/Z,
inside, windmill, fps, grass, drawCalls, tris, counts — updated every frame —
plus test hooks `teleport(x, z)` and `setCamYaw(y)` that do not bypass the real
input pipeline.

#### Scenario: Probe is live

- **WHEN** the page loads
- **THEN** successive snapshots show increasing scene time and fresh stats

### Requirement: Playwright E2E suite

An E2E suite SHALL run against the preview build on port 4173 in headless
Chromium with SwiftShader WebGL, covering: boot readiness, arrow-key movement +
camera follow, drag orbit + zoom, wall blocking (house-local bounds), door
entry AND exit, windmill animation, and perf budgets (grass ≥ 40k,
draw calls ≤ 120).

#### Scenario: Full controls pass E2E

- **WHEN** the suite runs
- **THEN** every control test passes using real keyboard/mouse events only
  (probe hooks configure the start state, never the movement itself)

### Requirement: Visual artifacts

The suite SHALL save screenshot artifacts (exterior spawn view and house
interior) for human review.

#### Scenario: Screenshots captured

- **WHEN** the suite finishes
- **THEN** PNG artifacts exist for the exterior and interior views
