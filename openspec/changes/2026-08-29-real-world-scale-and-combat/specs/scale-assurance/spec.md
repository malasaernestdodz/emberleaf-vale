# scale-assurance Specification

## ADDED Requirements

### Requirement: Player-relative scale invariants

World constants SHALL keep player-relative proportions: the windmill tower at
least 8x player height with a door at least 2.5x player diameter; the mansion
storey at least 1.8x player height and its front door header at least 1.5x player
height; stair visual rise within [0.15, 0.21] m and slope within [0.3, 0.5]; and
every furniture top intended for jumping at or below the 0.845 m jump apex.

#### Scenario: Constants sweep proves the proportions

- **WHEN** the scale spec evaluates the exported world constants
- **THEN** every invariant above holds and the suite fails if a future edit
  shrinks any building below real-world proportions

### Requirement: Landmark distance floor

Landmarks SHALL keep minimum spacing so the world reads large: mansion stair
bottom > 18 m from the well and > 4 m from the mansion entrance; mansion front
> 12 m from the well; windmill > 30 m from the plaza; house > 8 m from the well;
windmill > 45 m from the mansion.

#### Scenario: Distance floor sweep

- **WHEN** the scale spec measures the distances between exported landmark
  positions
- **THEN** every pair clears its floor and no building edit can silently crowd
  the valley again

### Requirement: Collision tiling and step-limit math is verified

The windmill wall tiling SHALL be provably sealed (adjacent tangent boxes overlap:
step <= 2·atan(hw/rWall), far edge exactly meets the door side) and every
height-field transition SHALL respect the 0.55 m step limit — including the
spiral-to-landing step, which SHALL stay <= 0.55 m at any future spiral height.

#### Scenario: Seal and step sweep

- **WHEN** the scale spec recomputes the tiling coverage and the landing step
  from the exported constants
- **THEN** the ring is sealed with overlap and the landing step is within the
  step limit (catching the 0.58 m regression introduced by the 6.4 m spiral)

### Requirement: Visual scale records

The suite SHALL capture player-anchored screenshots at the windmill door and the
mansion stair bottom on every run (test-results/scale-*.png) so scale regressions
are reviewable by a human, in addition to the numeric gates.

#### Scenario: Screenshots captured per run

- **WHEN** the scale spec runs
- **THEN** scale-windmill-door.png and scale-mansion-stair.png are written with
  the player standing at those anchors
