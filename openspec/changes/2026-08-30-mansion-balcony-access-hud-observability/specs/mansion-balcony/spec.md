# mansion-balcony Specification

## ADDED Requirements

### Requirement: Balcony doorway in the back wall of floor 2

The mansion back wall above floor 2 SHALL contain a walkable doorway centered on the
balcony deck (`lx 3.85 → 5.35`, from `F2` to `F2 + 2.4`) with a solid wall + collider on
both sides and a lintel collider above, so a standing player can walk from the floor-2
slab onto the balcony deck without jumping, crouching or clipping.

#### Scenario: Walk from floor 2 onto the balcony

- **WHEN** the player stands on the floor-2 east slab at the doorway height and walks
  through the back wall opening toward the deck
- **THEN** they cross the wall plane, stay grounded at `F2 ± 0.25`, and end standing on
  the balcony deck inside the railing

#### Scenario: Mesh and collision agree at the doorway

- **WHEN** a downward ray is cast at the deck center just outside the wall from above
  floor 2
- **THEN** the first hit is the visible balcony deck within `0.15` of `F2`

### Requirement: No stray openings over the stairwell

The back wall band above the stairwell (`lx −0.95 → 0.95`) SHALL be solid from `F2` to
the wall top in both mesh and collider, so the "door at the top of the stairs" that
dropped players onto the terrain is gone.

#### Scenario: Pushing into the old opening stops at the wall

- **WHEN** the player on the upper stairs walks north into the back wall at
  `lx ≈ 0.5`
- **THEN** they are stopped with the wall plane ahead (local `lz` stays above
  `−6.1`), grounded on the stair ramp

### Requirement: Balcony deck is guarded walkable surface

The balcony deck (`lx 2.8 → 6.4`, `lz −7.5 → −6.0`) SHALL be walkable at `F2` (gated on
current height so the terrain under the deck still applies at ground level) and the
existing rail, side-rail and post colliders SHALL seal all open edges.

#### Scenario: Railing stops the walk

- **WHEN** the player on the deck walks straight at the front railing
- **THEN** they stop inside the deck bounds, grounded at `F2 ± 0.25`, without falling
