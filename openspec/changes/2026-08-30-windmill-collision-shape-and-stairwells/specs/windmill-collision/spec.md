# windmill-collision Specification

## ADDED Requirements

### Requirement: Plinth is a walkable porch with a skirt, not a hologram

The windmill plinth SHALL be part of the walkable ground model: its top (`MILL.floorH`
above `MILL.base`) SHALL be a standable porch ring from the tower wall out to
`MILL.porchR` (5.7), and the plinth skirt (`porchR → MILL.skirtR` (6.1)) SHALL be a
walkable slope down to terrain. No player position within the plinth footprint SHALL
place the player's body inside the stone mesh.

#### Scenario: No clipping at the base

- **WHEN** the player walks into the plinth from any side
- **THEN** the feet track the porch or skirt surface within 0.15 u instead of passing
  through the stone cylinder

### Requirement: Entry is a flush threshold reached by steps

Two entry steps (0.4 u rise each, at or below `PLAYER.step`) at the door SHALL connect
terrain to the porch, and the door threshold SHALL be flush with the porch so entering
requires no vertical negotiation beyond the steps. The buried-at-the-door state (feet
more than 0.5 u below the threshold while crossing it) SHALL be impossible.

#### Scenario: Walk in through the front door

- **WHEN** the player holds a movement key from the path outside toward the door
- **THEN** they climb the two steps, cross the porch, and pass the threshold standing at
  `MILL.base + MILL.floorH` (±0.2) without jumping or teleporting

### Requirement: Spiral is solid, floor-connected, and one-sided

The interior floor SHALL sit at `MILL.floorH` and the spiral walkable SHALL ramp from
that floor to the landing at `MILL.base + MILL.top`, matching the visible steps. The
ramp SHALL apply only in an outer annulus (`d > 1.8`) and only when the player's current
height is within 0.9 u of it, so the flat center floor is walkable under the spiral and
the player can never be lifted through the steps from below. Step geometry SHALL be
thick enough to read as one solid staircase rising out of the floor.

#### Scenario: Climb with plain input

- **WHEN** the player holds a movement key and steers coarsely along the spiral
- **THEN** they reach the landing at `MILL.base + MILL.top` (±0.4) while grounded, with
  no seam above `PLAYER.step`

#### Scenario: No pop-up through the steps

- **WHEN** the player stands on the center floor and walks outward beneath the spiral
- **THEN** the feet stay on the floor and movement into the annulus at high local ramp
  height is blocked like a wall

### Requirement: Visual meshes are generated from the walkable constants

Windmill interior visuals (floor disc height, step placement/thickness, entry steps)
SHALL be derived from the same exported constants the walkable model uses
(`MILL.floorH`, `MILL.top`, `MILL_ARC`, step radii), staying inside the existing merged
geometry buckets with no additional draw calls.

#### Scenario: Height parity

- **WHEN** a downward ray is cast at any sampled spiral position from above
- **THEN** the first visible-mesh hit is within 0.3 u of the walkable height at that
  position
