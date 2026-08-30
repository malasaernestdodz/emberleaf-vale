# character-control Specification

## ADDED Requirements

### Requirement: Buffered input edges

Key and click edges SHALL remain consumable for 500 ms after the press (input
buffer), so a quick press registers on the next frame even when a frame runs late;
consuming an edge removes it exactly once.

#### Scenario: Quick press survives a late frame

- **WHEN** a key is pressed and the next game frame runs more than 100 ms later
- **THEN** the edge is still observed exactly once by the intended handler

### Requirement: Frame-rate independent jump

Jump/gravity integration SHALL be sub-stepped (dt <= 16 ms) so the apex equals
vy²/2g = 0.845 m at any frame duration up to 0.5 s, and landing snaps to
`groundHeight` without sinking.

#### Scenario: Full apex at low frame rate

- **WHEN** the player jumps while the renderer produces long frames
- **THEN** the sampled maximum height still exceeds 0.4 m above the take-off
  ground and the player lands grounded

### Requirement: Collider shape debug view

Pressing `C` SHALL toggle a wireframe overlay of every collider: cylinders for
circle colliders and yaw-aligned boxes for box colliders, each spanning its
y0→top span, with no draw-call cost while hidden; the state SHALL be exposed as
`snapshot().colliders`.

#### Scenario: Toggle and inspect shapes

- **WHEN** the player presses `C` twice
- **THEN** `snapshot().colliders` flips true then false and the overlay shows
  cylinders for the well/rocks and boxes for the walls while visible
