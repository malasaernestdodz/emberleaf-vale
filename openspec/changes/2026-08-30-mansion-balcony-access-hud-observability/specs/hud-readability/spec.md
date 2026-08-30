# hud-readability Specification

## ADDED Requirements

### Requirement: Vitality hearts are legible on any background

The vitality HUD SHALL render on a dark translucent plate (backing fill, border,
rounded corners, drop shadow) with a high-contrast ember label, so filled hearts
(bright red fill, cream outline), empty hearts, and the `hp/maxHp` count are readable
over bright sand, dark interiors, and motion alike.

#### Scenario: Hearts plate contrast

- **WHEN** the HUD is visible with any hp value
- **THEN** the hearts widget carries a non-transparent backing layer, and filled/empty
  hearts are distinguishable by fill brightness, not silhouette alone

#### Scenario: Count keeps up with damage

- **WHEN** the player takes damage or heals
- **THEN** the plate count and filled-heart tally reflect the new value without the
  widget leaving the screen

### Requirement: The slime enemy reads against the terrain

The slime body and its full-HP bar SHALL use a color clearly distinct from the grass
and terrain palette (teal-blue family), so the enemy, its location, and its health bar
are identifiable at mid distance.

#### Scenario: Slime stands out on grass

- **WHEN** the slime idles on open grass in daylight
- **THEN** its body and health-bar fill render in the teal-blue enemy palette rather
  than the grass green
