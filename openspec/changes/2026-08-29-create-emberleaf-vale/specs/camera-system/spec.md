# camera-system Specification

## ADDED Requirements

### Requirement: Third-person spherical follow camera

The camera SHALL orbit the player using explicit spherical coordinates
(yaw, pitch, distance) around a target above the player's head, with position
damped (k = 7) and look-target damped (k = 12), both framerate-independent.

#### Scenario: Camera follows movement

- **WHEN** the player moves
- **THEN** the camera position changes smoothly and remains within 3–12 units
  of the player

### Requirement: Drag look and wheel zoom

Pointer drag SHALL map horizontal motion to yaw (−dx · 0.0052) and vertical to
pitch (+dy · 0.0045) with pitch clamped to [0.08, 1.25]; the mouse wheel SHALL
scale distance exponentially, clamped to [3, 11].

#### Scenario: Drag orbits the view

- **WHEN** the pointer is dragged ≥ 200 px horizontally
- **THEN** camera yaw changes by ≥ 0.4 rad and the player heading is unaffected

### Requirement: Camera never clips the ground or walls

Camera Y SHALL be clamped to at least `terrainHeight(camera) + 0.35`; when the
player is indoors, the follow distance SHALL ease to ~0.35× (≈2.3 units) and the
camera position SHALL be clamped inside the house footprint.

#### Scenario: Indoors framing stays tight

- **WHEN** the player enters the house
- **THEN** the camera eases to ≈2.3 units behind the player, remains inside the
  room, and never shows through walls or the roof
