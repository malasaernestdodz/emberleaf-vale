# health-hud Specification

## ADDED Requirements

### Requirement: Slime vitality bar above the creature

A camera-facing vitality bar SHALL float above the slime: a gold-framed strip
on a dark bark backing whose fill shows `hp / maxHp`, left-anchored, tinted
leaf-green above two-thirds, ember above one-third, and wound-red below, with a
red damage-trail that shrinks slower than the fill. It SHALL be drawn without
depth so grass or the slime body never occlude it, and SHALL read full on
spawn and empty when the slime pops.

#### Scenario: Every swing visibly drains the bar

- **WHEN** the player lands sword hits on the slime
- **THEN** the mirrored `slimeHud.frac` drops from 1 to 2/3 to 1/3 as HP
  drops, `shown` stays true while the slime is visible, and the fill eases to
  the new fraction with the ghost trailing behind

### Requirement: Hero hearts row in the HUD

The DOM HUD SHALL show the hero's hearts as an ember row with a `hp/maxHp`
count, empty hearts drawn as hollow husks, a pulse when damage lands, a red
vignette that tracks the hurt flash, and a faint veil when the hero faints.

#### Scenario: HUD hearts match the hero's health

- **WHEN** the hero loses or regains hearts
- **THEN** the count testid reads the new `hp/maxHp` and the filled heart
  count matches
