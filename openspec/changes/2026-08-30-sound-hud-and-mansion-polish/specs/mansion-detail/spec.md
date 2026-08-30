# mansion-detail Specification

## ADDED Requirements

### Requirement: Glass reads as glass

Window panes on the house and mansion SHALL use a shared transparent
`MeshPhysicalMaterial` with clearcoat and a sky-matched PMREM environment (built once
from a small procedural gradient scene), plus visible mullion frames and a faint warm
interior emissive tint. The flat `meshBasicMaterial` glow sticker SHALL be removed.

#### Scenario: Reflections visible
- **WHEN** the camera orbits the mansion in daylight
- **THEN** panes show sky-toned reflections and depth instead of a flat yellow quad

### Requirement: Mansion architectural depth

The mansion SHALL gain: an entrance portico (columns, pediment, platform steps), a
balustraded balcony above the portico, corner quoins, a perimeter string course at
floor-2 level, a roof cornice, two chimneys with caps, pediment + sill trim on every
window, and front dormers. New geometry SHALL join the existing merged color buckets
(no per-part meshes) and SHALL NOT change colliders, walkables, or interactables.

#### Scenario: Massing reads as a manor
- **WHEN** the player views the mansion from the front path
- **THEN** the entrance, balcony, quoins, and roofline breaks are distinguishable

#### Scenario: E2E invariants hold
- **WHEN** the E2E suite runs after the changes
- **THEN** stairs, balcony walk-under, camera clamps, and collision tests pass unchanged

### Requirement: Surface relief on toon walls

Plaster and roof buckets SHALL use a shared procedural noise normal map (128² DataTexture,
low strength, coarse repeat) compatible with `meshToonMaterial`. No image downloads.

#### Scenario: Walls catch light differently across facades
- **WHEN** the sun-facing and shaded facades are compared
- **THEN** the plaster shows subtle non-uniform relief rather than flat single-tone bands
