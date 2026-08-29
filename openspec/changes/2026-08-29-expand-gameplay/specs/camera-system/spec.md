# camera-system Specification (delta)

## ADDED Requirements

### Requirement: Occlusion-clamped indoor camera for every building

While indoors, the follow distance SHALL be clamped by a ray-cast exit of the
containing volume — ray-vs-OBB (house, mansion) or ray-vs-circle (windmill tower) —
with a single unified indoor factor driving distance easing, a +0.2 pitch bias, and
per-building ceiling clamps. Zooming in or out indoors SHALL behave identically in
every building with no wall clipping and no discontinuities between buildings.

#### Scenario: Consistent indoors across buildings

- **WHEN** the player enters the house, the mansion, or the windmill and looks/zooms
  around
- **THEN** the camera remains inside the containing volume (asserted via probe world
  coordinates) in all three cases
