# windmill-interior Specification

## ADDED Requirements

### Requirement: Enlarged enterable windmill

The windmill SHALL stand on an enlarged mound (amp 3.4) with a tower (wall r 2.9,
h 8.5, door gap facing the path) whose wall ring colliders leave a ≥ 2.3 m door
opening; the interior SHALL contain a wooden floor, center pole, and millstone.

#### Scenario: Enter through the door

- **WHEN** the player walks through the door gap from the path
- **THEN** they stand on the base floor (base + 0.02) with the millstone beside them

### Requirement: Interior spiral staircase

An interior spiral SHALL rise 3.6 m over one turn around the center pole as a
height-field: door wedge (φ < 0.35) at base floor, monotonic ramp
(0.35 ≤ φ ≤ 2π−0.35), top balcony wedge (φ ≥ 2π−0.35) at base + 3.6 — with no
vertical discontinuity above step height anywhere, and 18 visible sector steps.

#### Scenario: Monotonic climb to the balcony

- **WHEN** groundHeight is swept along the spiral annulus
- **THEN** it increases monotonically from base + 0.02 to base + 3.6 and the sweep
  ends within 0.3 of the top

#### Scenario: Player reaches the balcony

- **WHEN** the player enters the door and follows the spiral (forward + steering)
- **THEN** they reach base + 3.6 without falling, glitches, or invisible walls

### Requirement: Center shaft is open

The tower center (r < 1.5) SHALL remain open at every level: the base floor and
millstone below, the spiral above, so falling from the balcony lands physically on
the base floor.

#### Scenario: Base floor stays walkable under the spiral start

- **WHEN** the player walks straight in from the door toward the center
- **THEN** they cross the full wedge on the base floor (lift < 0.8) and reach the
  millstone beside the pole with no invisible wall
