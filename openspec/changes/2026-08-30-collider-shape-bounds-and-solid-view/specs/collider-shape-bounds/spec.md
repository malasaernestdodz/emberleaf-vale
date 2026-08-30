# collider-shape-bounds Specification

## ADDED Requirements

### Requirement: Every collider declares finite vertical bounds

Each entry in `COLLIDERS` SHALL declare a finite `top` greater than its `y0`
(default 0), matched to the visible mesh it represents. The debug overlay and
`colliderBlocks` SHALL never fall back to an implicit infinite height for any
collider in the shipped world.

#### Scenario: No infinite colliders ship

- **WHEN** the collider list is enumerated after boot
- **THEN** every collider has a defined `top` with `y0 < top < 40`

### Requirement: Structural walls bound at their mesh height

Cottage wall colliders SHALL cap at `HOUSE.h` (2.9), mansion full-height wall
colliders at the mansion wall height (9.3), and the windmill wall ring from the
porch line (`MILL.base + MILL.floorH`) to the visible wall top
(`MILL.base + 0.6 + MILL_TOWER.h`). No wall collider SHALL extend visibly above
or below the wall mesh it matches.

#### Scenario: Overlay hugs the cottage

- **WHEN** the collider view is enabled beside the cottage
- **THEN** the wall boxes stop at the eave line instead of towering over the roof

### Requirement: Tree colliders read as trees

A standing tree's collider SHALL have radius `0.45 * s` and cap at `3.4 * s`
above its base — between trunk top and canopy top — and the chop/regrow cycle
SHALL restore exactly those values.

#### Scenario: Canopy parity

- **WHEN** a downward ray is cast at a standing tree's trunk from above
- **THEN** the first mesh hit (canopy) is above the collider top, and the collider
  top is at least 1.8 u above the tree base

### Requirement: Bounding never opens a gameplay hole

Bound adjustments SHALL only remove blocking where the removed volume is
unreachable in normal play (jump apex 0.845 u, no step above `PLAYER.step`), and
all pre-existing movement contracts (walls block, thresholds walkable, spiral
climb, mansion stairs) SHALL keep passing.

#### Scenario: Movement contracts still hold

- **WHEN** the existing movement suite runs (walls block, door thresholds,
  windmill spiral climb, mansion stairs, fountain rim)
- **THEN** every assertion passes unchanged alongside the new bounds
