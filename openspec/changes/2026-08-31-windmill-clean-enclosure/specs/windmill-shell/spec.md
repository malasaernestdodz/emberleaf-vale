# windmill-shell

## MODIFIED Requirements

### Requirement: The tower shell is enclosed except for the door and the balcony doorway

The windmill wall SHALL present a solid surface at every height except two
door-sized openings: the ground-level door slit (from the plinth to the
lintel top) and the vista-balcony doorway (from the deck to the doorway
lintel at deck + `MILL_BALCONY.lintelH`). No position on the tower silhouette
outside those two openings SHALL show sky or the tower interior — the wall is
solid from the doorway lintel to the wall top, and the door slit SHALL NOT
extend above the ground lintel, and the balcony opening SHALL NOT extend
below the deck or above the doorway lintel.

#### Scenario: No full-height slit at the door

- **WHEN** an observer at the porch looks at the tower above the door lintel
- **THEN** the wall surface is continuous from the lintel up to the balcony
  deck, with no view into the interior

#### Scenario: No full-height slit at the balcony

- **WHEN** an observer at ground level looks at the tower under the balcony
  deck
- **THEN** the wall surface is continuous from the plinth up to the deck, with
  no view into the interior

#### Scenario: No sky above the balcony doorway lintel

- **WHEN** an observer outside the tower, or on the balcony deck, looks at the
  wall above the balcony doorway lintel
- **THEN** the wall surface is continuous from the doorway lintel to the wall
  top (crown band, full circle), with no sky and no view into the interior,
  and the jambs and lintel cover the band cut edges over the full doorway
  height
