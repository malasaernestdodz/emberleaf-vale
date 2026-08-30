# windmill-shell

## ADDED Requirements

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
