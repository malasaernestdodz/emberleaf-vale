# atmosphere Specification

## ADDED Requirements

### Requirement: Gradient sky with procedural clouds

A sky dome (BackSide sphere, r = 185) SHALL render a zenith-to-horizon gradient,
a sun disc + glow along the sun direction, and drifting fbm cloud coverage that
fades at the horizon, all in one fragment shader.

#### Scenario: Clouds drift

- **WHEN** time advances
- **THEN** the cloud field offsets slowly without CPU work

### Requirement: Ambient life

The scene SHALL include falling autumn leaves (≥ 120 instanced quads with
per-leaf color, spiral fall, respawn loop), ≥ 6 flapping butterflies following
Lissajous paths, and scattered flowers reusing accepted grass positions.

#### Scenario: Leaves recycle

- **WHEN** a leaf reaches the ground
- **THEN** it respawns above the meadow and continues falling
