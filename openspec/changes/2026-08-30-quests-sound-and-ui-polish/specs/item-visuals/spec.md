# item-visuals Specification

## ADDED Requirements

### Requirement: Distinct multi-part item meshes

Each pickup type SHALL render as a distinct merged multi-part toon mesh with
per-part vertex colors — a faceted gray rock, a flower with stem/leaves/petals,
a bark-colored log with pale end caps, a teal fish with tail fin and eye, a
bread-roll food with toasted ends, and a translucent-green gel blob — while
staying a single instanced draw call per type.

#### Scenario: Fish looks like a fish

- **WHEN** a fish pickup lies on the ground
- **THEN** its mesh is composed of a body, a contrasting tail fin, and an eye
  rendered from one merged geometry with vertex colors

### Requirement: SVG hotbar icons

Every hotbar slot SHALL show an inline SVG icon matching its item type
(rock, flower, wood, fish, food, gel) above the count, replacing the
text-only label, and the icon SHALL pop-scale when the slot becomes active.

#### Scenario: Hotbar shows six icons

- **WHEN** the game boots
- **THEN** the hotbar renders six slots, each containing one `.slot-icon` SVG,
  and selecting a slot applies the active pop animation

### Requirement: Idle item motion

Light items (flower, gel, fish) SHALL bob and slowly rotate in place while
resting, and every item SHALL tumble while flying, without per-frame heap
allocation.

#### Scenario: Resting flower bobs

- **WHEN** a flower pickup rests on the ground for a second
- **THEN** its height oscillates around the ground offset and its yaw slowly
  advances
