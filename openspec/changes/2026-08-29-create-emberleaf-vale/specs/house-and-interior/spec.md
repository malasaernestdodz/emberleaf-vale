# house-and-interior Specification

## ADDED Requirements

### Requirement: Walkable interior via a real doorway

The house (7 m × 6 m, yaw −1.107, at (12, −10)) SHALL have a 1.3 m door gap in
the plaza-facing wall implemented as two collider boxes, and the player SHALL be
able to walk in and out through it with the arrow keys.

#### Scenario: Enter through the door

- **WHEN** the player is placed 1.6 units outside the door facing it and ArrowUp
  is held
- **THEN** `inside` becomes `true` without passing through walls

#### Scenario: Exit through the door

- **WHEN** the player inside faces the door and walks out
- **THEN** `inside` becomes `false`

### Requirement: Interior dressing and lighting

The interior SHALL contain a wood floor, rug, table with stools and teapot, bed,
bookshelf, and a lantern with a warm point light; furniture SHALL have colliders
and the interior SHALL read as noticeably warmer than the exterior lighting.

#### Scenario: Furniture is solid

- **WHEN** the player walks into the table, bed, or bookshelf
- **THEN** the player is blocked at the furniture colliders

### Requirement: Ghibli house exterior

The exterior SHALL include lavender plaster walls with dark timber framing, a
red bell-curve lathe roof with overhang, glowing amber windows picked up by
bloom, an open door mesh, and a stone chimney.

#### Scenario: Windows glow

- **WHEN** the exterior renders
- **THEN** window quads use emissive/basic material above the bloom threshold
