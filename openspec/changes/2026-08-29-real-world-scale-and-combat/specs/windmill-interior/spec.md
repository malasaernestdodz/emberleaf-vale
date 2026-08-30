# windmill-interior Specification

## ADDED Requirements

### Requirement: Grand enterable windmill (supersedes "Enlarged enterable windmill")

The windmill SHALL stand on a 4.6 m mound with a tower (wall r 4.1, h 12.2, hub at
10 m, sail radius 5.2 m) whose ring of tangent-box colliders tiles the wall
contiguously (chord >= arc) and leaves an exact 1.6 m clear door (2.5x player
diameter) with frame and ajar leaf visuals; the interior SHALL contain a wooden
base floor, a climbable millstone plinth (r 0.78, base + 0.5), and a center pole.

#### Scenario: Enter through the door

- **WHEN** the player walks through the door gap toward the center
- **THEN** they cross the whole wedge on the base floor, step onto the plinth
  (lift < 0.8), and stop at the pole with no invisible wall

### Requirement: Solid spiral staircase with separate landing (supersedes "Interior spiral staircase")

The spiral SHALL rise 5.2 m over one turn (ARC = 2π − 1.35) as a solid height-field
annulus r ∈ [0.55, 3.6] with a grade of 0.29; sectors SHALL be single-valued: door
wedge |φ| < 0.45 at base floor, spiral φ ∈ [0.45, 2π−0.9], landing
φ ∈ [2π−0.9, 2π−0.45) at base + top with a <= 0.39 m step from the ramp; no
vertical discontinuity above the 0.55 step limit may exist anywhere inside.

#### Scenario: Monotonic climb to the landing

- **WHEN** groundHeight is swept along the spiral annulus at r = 2.05
- **THEN** it increases monotonically from base + 0.02 to base + 5.2 and the
  landing sector reads exactly base + top

#### Scenario: Player reaches the top without falling through

- **WHEN** the player enters the door and follows the spiral with steering
- **THEN** they reach base + 5.2 with no fall-through, no sector seam, and no
  invisible wall at any radius

### Requirement: No door-top sector conflict (supersedes "Center shaft is open")

Every (x, z) column inside the tower SHALL have exactly one ground height: the
former overlap where the top wedge shared the door sector SHALL NOT regress, and
the base floor SHALL stay walkable under the spiral start and across the door
wedge.

#### Scenario: Doorway is floor-level on both sides

- **WHEN** groundHeight is sampled across the full door wedge at any radius
- **THEN** every sample is base + 0.02 (never balcony height)
