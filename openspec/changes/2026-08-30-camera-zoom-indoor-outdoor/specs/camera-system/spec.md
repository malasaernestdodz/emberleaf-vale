# camera-system Specification (delta)

## MODIFIED Requirements

### Requirement: Occlusion-clamped indoor camera for every building

While indoors, the follow distance SHALL be clamped by the shared
wall-distance helpers from `lib/camera.ts` — `obbWall` (house, mansion) or
`circleWall` (windmill tower) — returning the ray's exit distance when the
player starts inside the (margin-shrunk) volume and `Infinity` when no clamp
applies. A single unified indoor factor drives distance easing, a +0.2 pitch
bias, and per-building ceiling clamps. Zooming in or out indoors SHALL behave
identically in every building with no wall clipping and no discontinuities
between buildings.

#### Scenario: Consistent indoors across buildings

- **WHEN** the player enters the house, the mansion, or the windmill and
  looks/zooms around
- **THEN** the camera remains inside the containing volume (asserted via probe
  world coordinates) in all three cases

## ADDED Requirements

### Requirement: Unoccluded outdoor zoom after leaving a building

When the player is outside a building and the player→camera ray crosses its
footprint at a point below the wall top, the follow distance SHALL be clamped
to 0.5 m in front of the first crossed wall; otherwise no outdoor clamp
applies. Leaving a building SHALL therefore release the zoom smoothly — the
camera never zooms out behind a wall, and the zoom returns to the full scroll
distance with a clear line of sight once the ray clears the footprint.

#### Scenario: Leaving the house releases the zoom

- **WHEN** the player walks out of the house door and away from it with the
  camera trailing toward the house
- **THEN** the segment between player and camera never enters the house
  footprint below the wall top while exiting, and after the interior factor
  settles the player-to-camera distance exceeds the indoor zoom range with the
  camera outside the footprint

#### Scenario: Zooming out outdoors over a roof is not clamped

- **WHEN** the player stands away from a building and scrolls the zoom out
  with the camera above the wall top such that the view clears the roofline
- **THEN** the camera reaches the full clamped scroll distance

### Requirement: Guarded interior clamps and damped-only interior factor

The per-building interior position clamps SHALL apply only while the interior
factor exceeds 0.5 AND the player is inside that building's footprint (house
box, mansion box, or windmill radius). `game.interior` SHALL only ever change
through framerate-independent damping — never by direct assignment of 0 or 1.

#### Scenario: Camera is not locked in the house box after exit

- **WHEN** the player exits the house so `game.inside` becomes false
- **THEN** the house position clamp releases immediately and the camera is
  never projected back inside the footprint while the interior factor decays
