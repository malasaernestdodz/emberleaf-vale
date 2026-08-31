# health-hud Specification

## MODIFIED Requirements

### Requirement: Slime vitality bar in the HUD

The slime's vitality SHALL be displayed as a screen-fixed DOM bar pinned to
the top-center of the viewport — flat 2D chrome, never tracking the slime's
world position — with a gold-framed track on dark bark whose red fill shows
`hp / maxHp`, left-anchored, next to a `SLIME` label and an `hp/maxHp`
count. It SHALL be visible at all times during play: before first input,
while the slime hops, hides, or respawns (empty bar at 0%), while fishing,
while the book is open, and under the sleep veil; only the open pause menu
overlays it. No world-space slime bar SHALL remain.

#### Scenario: The bar never moves when the view changes

- **WHEN** the camera swings and the player relocates around the slime (the
  slime itself may idle in a keep-out pocket and not hop at all)
- **THEN** the bar's screen bounding box stays put (within 1 px) while the
  camera position provably changed, and only the fill width tracks
  `slimeHud.frac`

#### Scenario: The bar is always visible

- **WHEN** the slime is at full health, wounded, or hidden while respawning
- **THEN** the bar remains on screen, reading `3/3`, the drained fraction,
  or `0/3` respectively, with the fill colored red

#### Scenario: Every hit visibly drains the bar

- **WHEN** the player lands sword hits on the slime
- **THEN** `slimeHud.frac` drops from 1 to 2/3 to 1/3, the fill and count
  follow it, and the state mirrors in `window.__Ghibli.snapshot().slimeHud`
