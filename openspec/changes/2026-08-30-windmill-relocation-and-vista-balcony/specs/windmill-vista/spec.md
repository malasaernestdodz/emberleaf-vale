# windmill-vista

## ADDED Requirements

### Requirement: The windmill climb ends at a usable vista balcony

The windmill's top landing SHALL connect through a doorway in the tower wall to
an exterior balcony deck at landing height (`MILL.base + MILL.top`), covering a
phi arc at least 0.5 rad wide and reaching at least 2 u beyond the wall. The
deck SHALL be walkable end-to-end from the spiral stairs with plain held keys
(no teleports), and SHALL be fenced by a guard rail with colliders that stop the
player at the outer edge while remaining passable underneath (raised y0).

#### Scenario: Climb to the view

- **WHEN** the player climbs the spiral to the landing and walks outward across
  the wall opening
- **THEN** they stand grounded on the deck at `MILL.base + MILL.top` (±0.3)
  outside the wall radius, without falling or being blocked

#### Scenario: Rail holds, porch passes

- **WHEN** the player walks outward on the deck toward `MILL_BALCONY.r1`
- **THEN** a rail collider stops them inside the deck radius, and a player at
  ground level walking under the deck is not lifted (deck walkable is gated on
  current height)

### Requirement: The vista completes a quest end to end

The balcony SHALL host an interactable ("Take in the view") that completes a
quest (`lookout` — "The Keeper's Watch") exactly once via the `game.vista`
latch, feeding the standard quest HUD, toast, and sound contract.

#### Scenario: Watch from the top

- **WHEN** the player stands on the deck at the telescope and presses E
- **THEN** the `lookout` quest progress becomes 1/1 with a completion toast, a
  second E press does nothing further, and the HUD count reflects the quest
