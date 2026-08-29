# character-control Specification

## ADDED Requirements

### Requirement: Camera-relative keyboard movement

The player SHALL move using Arrow keys and WASD, relative to the camera yaw:
Up = away from camera, Down = toward camera, Left/Right = strafe. Movement speed
SHALL be 3.4 m/s walking and 6.2 m/s while Shift is held, smoothed with
framerate-independent damping (k = 10).

#### Scenario: Arrow keys displace the player

- **WHEN** ArrowUp is held for ~0.7 s from spawn
- **THEN** the player's XZ displacement exceeds 1.0 unit and the camera follows

#### Scenario: Strafe changes heading

- **WHEN** ArrowLeft or ArrowRight is held
- **THEN** the player translates sideways and the character heading turns toward
  the movement direction (shortest-arc damping)

### Requirement: Kinematic collision resolution

The player capsule (r = 0.32) SHALL be resolved against circle and OBB colliders
with 3 iterations per frame (minimum-penetration-axis pushout for boxes), with
dt clamped to ≤ 50 ms to prevent tunneling.

#### Scenario: Walls block the player

- **WHEN** the player walks into any house wall from inside
- **THEN** house-local |x| stays within the wall bounds (no pass-through)

#### Scenario: Landmarks are solid

- **WHEN** the player walks into the fountain, well, windmill, trees, or rocks
- **THEN** the player is pushed out of each collider radius

### Requirement: Terrain following and play-area border

The player Y SHALL equal the shared terrain height function (house floor inside
the footprint), and position SHALL be softly clamped to the world radius.

#### Scenario: Player never leaves the valley

- **WHEN** the player walks outward for a sustained time
- **THEN** XZ position stays within the world radius

### Requirement: Chibi character presentation

The character SHALL be a stylized chibi figure (body, head, hair, eyes, arms,
legs) with procedural walk animation (limb swing scaled by speed, body bob,
lean) and idle breathing, facing its movement heading.

#### Scenario: Animation state follows motion

- **WHEN** the player transitions between idle and movement
- **THEN** limb swing amplitude and bob track the current speed
