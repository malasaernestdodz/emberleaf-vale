# character-control Specification (delta)

## ADDED Requirements

### Requirement: Pointer-lock mouse look with hidden cursor

Clicking the world SHALL capture the pointer (cursor invisible); mouse movement SHALL
map movementX/Y to yaw/pitch (clamped 0.08–1.25). A small drag (< 6 px) triggers
capture; Esc releases; drag-orbit remains as fallback when unlocked.

#### Scenario: Quick presses always register

- **WHEN** any key is pressed and released within a single animation frame
- **THEN** the edge is captured by the event handler and consumed by the loop

### Requirement: Sprint with feedback

Sprint (Ctrl, Shift, or double-tap W while moving forward) SHALL raise speed to
6.2 m/s and ease the camera FOV toward +8°; walk speed stays 3.4 m/s.

#### Scenario: Sprint covers more ground

- **WHEN** the player sprints forward for 1.4 s on open ground
- **THEN** displacement exceeds 4.0 units and the sprint factor exceeds 0.5

### Requirement: Jump with air and landing animation

Space (when grounded) SHALL set vy = 5.2 under gravity 16 (apex 0.845 m, air time
~0.65 s) with an airborne pose (tucked legs, raised arms) and a landing squash
(scale dip) scaled by fall speed.

#### Scenario: Jump is visible and lands

- **WHEN** the player jumps on flat ground
- **THEN** peak height exceeds 0.4 above the base and the player ends grounded within
  0.3 of the base height

### Requirement: Context-aware height field (no invisible walls, ever)

`groundHeight(x, z, curY)` SHALL resolve stacked levels by the caller's current
feet height: the mansion floor-2 region returns floor 2 when `curY > floor2 − 0.6`
and floor 1 otherwise; the windmill spiral returns a step's height only when
`curY` is within 0.55 below it, else the base floor. Collider spans (`y0`/`top`)
use 0.05 slack: furniture is solid at body height, walkable-under when raised,
and jump-standable only via the ground-height regions.

#### Scenario: Walk under the mansion balcony

- **WHEN** groundHeight is queried inside the floor-2 footprint with curY = 0.22
- **THEN** it returns floor-1 height (0.22), and with curY = 2.95 it returns 2.95

#### Scenario: Walk under the windmill spiral

- **WHEN** groundHeight is queried on the spiral annulus with curY at the base floor
- **THEN** it returns the base floor even where the spiral step above is 3.6 high

#### Scenario: Jump onto the fountain rim

- **WHEN** the player jumps toward the fountain rim (top 0.56)
- **THEN** walking is blocked below the top, the jump lands on the rim (y ≈ 0.56),
  and the basin interior is wadeable at 0.48
