# mansion-stairwell Specification

## ADDED Requirements

### Requirement: Second-floor slab has a real stairwell opening

The mansion floor-2 slab SHALL be built as boards around a rectangular opening over the
upper stair run (`lx −2.2 → 2.1`, `lz −6 → −4.0`) sized so that a standing player
clears the slab underside before reaching the opening. No stair part (steps, stringer,
rail, rail wall) SHALL intersect the slab boards.

#### Scenario: Stairwell is visible and open

- **WHEN** a downward ray is cast at the opening center from just above floor 2
- **THEN** the first hit is the stairs below (more than 0.2 u under the slab level), not
  a floor board

#### Scenario: Floor-2 view

- **WHEN** the player stands on floor 2 facing the stair run
- **THEN** the stairs descend through an open well guarded by a rail, not disappear
  under solid boards

### Requirement: No invisible ledges or fall traps at the opening

The walkable stair ramp SHALL extend to the opening's east edge with clamped height so
stepping from the top landing onto the east slab board is continuous, and the opening's
west edge SHALL have a waist-high guard rail with a collider (top `F2 + 1.0`, base at
`F2`) that blocks floor-2 walkers but not stair climbers below.

#### Scenario: Walk off the top landing

- **WHEN** the player walks east off the top of the stairs on floor 2
- **THEN** the ground height stays at `F2` across the transition (no dip, no wall)

#### Scenario: Guarded west edge

- **WHEN** the player on the west slab board walks east into the guard rail
- **THEN** they are stopped at the rail instead of falling, while a climber ascending
  underneath passes with headroom

### Requirement: Falling into the well lands on the stairs

A player who steps over any unguarded edge of the opening SHALL land on the stair ramp
below, grounded, at the ramp height for the landing position.

#### Scenario: Fall from floor 2 into the well

- **WHEN** the player on floor 2 walks west across the opening edge at the stair's depth
- **THEN** they land grounded on the mid-stairs with `floorY < y < F2 − 0.5`
