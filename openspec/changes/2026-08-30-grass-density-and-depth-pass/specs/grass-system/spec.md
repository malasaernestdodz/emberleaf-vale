# grass-system Specification

## ADDED Requirements

### Requirement: Grass respects walkable surfaces

> Deferred change (next sprint). Requirement captured now so the later
> implementation has a fixed target.

Grass blades SHALL be placed on the walkable ground model (`groundHeight`
sampling via a precomputed grid) rather than raw terrain noise, and SHALL NOT
intersect building floors, porch rings, stair slabs or path tread within a small
exclusion margin.

#### Scenario: No spears through the porch

- **WHEN** the camera looks across the windmill porch ring or mansion slab edge
- **THEN** no blade pierces the visible surface within the exclusion margin

### Requirement: Sway reads as wind, not waves

Per-blade sway phase SHALL be jittered from the seeded PRNG so neighboring blades
do not share a phase, eliminating visible wave bands across chunks while staying
deterministic between runs.

#### Scenario: Deterministic gusts

- **WHEN** the world boots twice with the same seed
- **THEN** blade placement and phase jitter are identical

### Requirement: Governor changes density with hysteresis

The auto-tuner SHALL drop grass density only on sustained load and SHALL restore
it gradually, so brief fps hitches do not trigger long low-density periods.

#### Scenario: Short hitch keeps the meadow

- **WHEN** a single frame exceeds the drop threshold
- **THEN** grass density is unchanged; only sustained drops reduce it
