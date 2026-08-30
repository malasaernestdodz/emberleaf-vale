# e2e-verification

## ADDED Requirements

### Requirement: Suite covers the enclosed windmill shell

The e2e suite SHALL assert the balcony-arc wall colliders stop a porch-level
player, carry a `top` at deck height, and keep the full-height tops outside
the arc; a gallery pose SHALL record the enclosed shell from the porch.

#### Scenario: Collider contract for the capped arc

- **WHEN** the suite inspects the wall ring colliders inside the balcony arc
- **THEN** each has `top` equal to `MILL.base + MILL.top` (±0.1), colliders
  outside the arc keep `top` near `MILL.base + 0.6 + MILL_TOWER.h`, and a
  porch-level walk-in at the arc midpoint ends with the player outside
  `MILL.rWall`
