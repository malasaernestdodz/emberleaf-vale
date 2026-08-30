# mansion Specification

## ADDED Requirements

### Requirement: Grand two-storey mansion at real proportions (supersedes prior mansion sizing)

The mansion SHALL be a 15 x 12 m timber-plaster hall at (−21.5, −16) (clear of the
well axis), floorY 0.25, floor2 3.3 (3.05 m storey), wall height 9.3 m, with a
1.8 x 2.6 m front door (header y0 2.6) and a roof scaled to the footprint.

#### Scenario: Storey height matches the player

- **WHEN** the player stands in the entrance hall
- **THEN** the ceiling is ~2x their height and the front door clears 1.68x their
  height without crouching logic

### Requirement: Enclosed grand staircase placed off the entrance

The staircase SHALL run along the east wall inside a 2 m-wide band
(lx 5.5→7.5, lz 5.2→−1.9), rising 3.05 m over 7.1 m of run (23°, visual steps
0.19 m rise / 0.44 m tread), enclosed by a rail collider (y0 floorY, top floor2+1)
so the only entry is from the front hall — not beside the door / well axis.

#### Scenario: Climb from hall to upstairs

- **WHEN** the player walks from the stair bottom to the top
- **THEN** y rises continuously to floor2, they cross onto the upstairs slab
  (mlz < lz0), and `insideMansion` stays true

### Requirement: Upstairs slab with balustrade and walkable-under back balcony

The upstairs slab SHALL cover lz < −1.9 at floor2 (curY-gated so the ground floor
stays walkable beneath is impossible by design and the slab edge is a visible
balustrade wall, y0 floor2, top floor2+1, opening only at the stair head); a
cantilevered back balcony SHALL extend 1.5 m beyond the back wall with rail
colliders scoped to y0 = floor2 and only two corner posts reaching the ground.

#### Scenario: Walk under the balcony with no invisible wall

- **WHEN** the player walks from behind the mansion straight toward the back wall
- **THEN** they pass under the balcony (max lift < 0.5) and stop against the wall
  with y still at ground level

#### Scenario: The stair head opens onto the slab

- **WHEN** the player continues past the stair top
- **THEN** they walk onto the slab without a step and the balustrade blocks the
  edge everywhere except the stair opening
