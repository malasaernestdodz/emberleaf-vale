# culling-system Specification

## ADDED Requirements

### Requirement: Distance culling of world props

Trees and landmarks SHALL be registered as cullables with a world position and
bounding radius. Every frame the engine SHALL compute the camera-to-object
distance and set `Object3D.visible` to `withinRenderDistance(dist,
renderDistance, radius)`, so objects beyond the render distance are never
submitted for rendering. Visibility of registered cullables SHALL be written by
exactly one module.

#### Scenario: Far landmarks drop out of the scene

- **WHEN** the camera rests more than `renderDistance + radius` from a landmark
  or tree
- **THEN** its registry entry and its `Object3D` both report not visible, and
  the registry counts it in `culled.total` but not `culled.visible`

#### Scenario: Render distance reveals hidden landmarks

- **WHEN** the render distance is raised above a hidden landmark's camera
  distance
- **THEN** the landmark becomes visible again without a reload

#### Scenario: Culling decisions honor the bounding radius

- **WHEN** the pure decision is probed at the boundary
- **THEN** `dist <= maxDist` is visible, `dist > maxDist` without margin is
  hidden, and with `margin = radius` the object stays visible until
  `dist > maxDist + radius`

### Requirement: Fog tracks the render distance

Scene fog far SHALL equal the render distance and fog near SHALL be 35% of it,
so culled objects vanish inside fog. Disabling fog SHALL lift the fog far cap
while distance culling still applies.

#### Scenario: Slider moves the fog wall

- **WHEN** the render distance is set to 60
- **THEN** the probe reports `fogFar` equal to 60 within rounding

#### Scenario: Fog toggle lifts the cap

- **WHEN** distance fog is switched off
- **THEN** `fogFar` exceeds 400 while culling counts remain governed by the
  render distance

### Requirement: Grass cutoff follows the render distance

The grass vertex shader cutoff SHALL be fed by the render distance setting via
the `uCull` uniform instead of a hardcoded literal, and the grass and flower
draws SHALL be togglable as a group.

#### Scenario: Grass toggle hides the blades

- **WHEN** the grass toggle is switched off and on
- **THEN** the `grass-root` object's visibility follows the toggle in both
  directions
