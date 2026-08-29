# terrain-and-paths Specification

## ADDED Requirements

### Requirement: Single analytic terrain height function

The system SHALL define `terrainHeight(x, z)` as the single source of truth for
ground height (fbm hills + windmill mound + feature flatten masks + path
flattening + pond bowl), and the terrain mesh, the player, the camera, and all
scatter passes SHALL all use it.

#### Scenario: Terrain is continuous and walkable

- **WHEN** the player moves across flattened features (plaza, path, house
  surroundings) and hills
- **THEN** the player's Y equals `terrainHeight(x, z)` with no jumps or gaps

### Requirement: Sand paths rendered and carved

Sand paths SHALL follow Catmull-Rom curves (spawn → plaza → house door, plus
branches to the well and pond), SHALL be visually distinct (sand vertex colors),
SHALL flatten the terrain along their width, and SHALL be excluded from grass
placement.

#### Scenario: Path excludes grass

- **WHEN** grass positions are scattered
- **THEN** no blade lies within 1.9 units of any path polyline

### Requirement: Pond depression

The pond area SHALL be a terrain bowl (bed at −0.62) with a water surface disc,
and walking through it SHALL slow the player to 2.0 m/s.

#### Scenario: Shallow water slows movement

- **WHEN** the player is within the pond water radius
- **THEN** movement speed is reduced to approximately 2.0 m/s
