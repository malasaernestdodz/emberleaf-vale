# windmill-shell Specification

## Purpose

The windmill tower shell: a fully enclosed procedural mesh (plinth, tapered
wall bands, roof cone, ground floor, spiral climb, top landing and vista
balcony deck) whose only openings are door-sized — the ground doorway with
its hinged leaf and the balcony doorway above the landing — with wall-ring
colliders matched to that enclosure so the shell is walkable end to end
(walk-in → spiral → deck → lookout) without see-through faces or cheat paths.

## Requirements

### Requirement: The tower shell is enclosed except for the door and the balcony doorway

The windmill wall SHALL present a solid surface at every height except two
openings: the ground-level door slit (from the plinth to the lintel top) and
the vista-balcony arc (from the deck to the wall top). No position on the
tower silhouette outside those two openings SHALL show sky or the tower
interior. The door slit SHALL NOT extend above the lintel, and the balcony
opening SHALL NOT extend below the deck.

#### Scenario: No full-height slit at the door

- **WHEN** an observer at the porch looks at the tower above the door lintel
- **THEN** the wall surface is continuous from the lintel up to the balcony
  deck, with no view into the interior

#### Scenario: No full-height slit at the balcony

- **WHEN** an observer at ground level looks at the tower under the balcony
  deck
- **THEN** the wall surface is continuous from the plinth up to the deck, with
  no view into the interior

### Requirement: The shell is solid below the balcony deck

The wall collider ring SHALL cover the balcony arc up to deck height
(`MILL.base + MILL.top`) so a player at porch level cannot walk through the
wall, while a player on the deck crosses the same arc unblocked (caps at or
below deck walking height). Segments outside the balcony arc SHALL keep their
existing full-height tops.

#### Scenario: Porch-level walk-through is stopped

- **WHEN** the player on the porch walks into the tower wall anywhere along
  the balcony arc
- **THEN** they are pushed back outside the wall radius and never reach the
  tower interior

#### Scenario: Deck crossing stays unblocked

- **WHEN** the player on the top landing walks outward across the balcony arc
  onto the deck
- **THEN** no wall collider stops them (the existing climb-to-vista path
  stays green)

### Requirement: The spiral climb presents a continuous surface with no see-through faces

The spiral climb SHALL present a continuous visual surface under every
walkable ramp position (an under-surface or skirt beneath the step boxes), and
no face of the tower interior SHALL be visible as sky from the opposite side:
the roof SHALL be visible from inside the tower and the ground floor SHALL be
visible from underneath.

#### Scenario: No sky through the spiral

- **WHEN** an observer at porch level looks up along the spiral climb
- **THEN** the treads present a continuous surface — no view passes between
  or beneath the step boxes to the ground floor or outside

#### Scenario: Interior roof is visible

- **WHEN** an observer on the top landing looks up inside the tower
- **THEN** the roof surface is visible, not sky

#### Scenario: Ground floor visible from below

- **WHEN** an observer under the porch overhang looks up at the ground-floor
  disc
- **THEN** the floor surface is visible, not see-through

### Requirement: The ground doorway is framed to its walkable width

The ground doorway frame (posts, jambs, leaf) SHALL span the wall slit width
(`2 · MILL.doorHalf · MILL.rWall`) exactly, and the leaf SHALL hinge at one
post so the opening reads as a proper door. Frame widths SHALL derive from
`MILL` constants (`doorStepW`, `doorHalf`), never hard-coded scene numbers.

#### Scenario: Frame fills the slit

- **WHEN** an observer at the porch looks at the doorway from the front
- **THEN** the frame edges meet the wall slit edges with no visible gap and
  the leaf covers the closed portion of the opening
