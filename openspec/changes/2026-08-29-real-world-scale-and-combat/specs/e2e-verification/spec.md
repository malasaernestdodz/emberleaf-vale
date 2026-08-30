# e2e-verification Specification

## ADDED Requirements

### Requirement: Deterministic serial test runs

The Playwright suite SHALL run with `workers: 1` and every building-related
teleport/camera yaw SHALL be derived from world constants (`MANSION`, `MANSION_STAIR`,
`MILL`, `houseWorld/mansionWorld/millWorld`) rather than hardcoded coordinates, so
geometry changes cannot desync the suite.

#### Scenario: Constants-derived navigation

- **WHEN** any building test teleports or steers the player
- **THEN** the coordinates come from the imported world constants and the suite
  passes without per-test magic numbers

### Requirement: 32-test regression gate

The suite SHALL cover: boot budgets, movement/sprint/jump, camera orbit/zoom,
house door in-out, sword attack on left click, collider toggle, windmill climb +
base floor, mansion stairs + back-balcony walk-under, fountain standability,
sleep, book, chop, pickup/throw, stool sitting, food boost, fishing, indoor zoom
in all three buildings, sails animation, and pure-math height-field consistency —
all green via `npm run test:e2e`.

#### Scenario: Full suite green

- **WHEN** `npm run test:e2e` runs
- **THEN** all 32 tests pass, including the sword, collider-toggle, and
  stair/slab consistency tests

#### Scenario: Ground math stays consistent at building edges

- **WHEN** the math spec sweeps the mansion stair band and samples the hall, slab
  top (curY high), and slab underside (curY low)
- **THEN** heights stay within [floorY, floor2] and the slab is standable only
  when the body is already upstairs
