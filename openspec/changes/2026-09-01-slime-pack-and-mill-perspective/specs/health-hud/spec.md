# health-hud Specification

## MODIFIED Requirements

### Requirement: Slime vitality bar in the HUD

The screen-fixed vitality bar pinned to the top-center of the viewport SHALL
belong to the BOSS slime: flat 2D chrome, never tracking the boss's world
position, gold-framed track on dark bark, red fill showing the boss's
`hp / maxHp`, left-anchored, labeled `BOSS SLIME` with an `hp/maxHp` count.
It SHALL be visible at all times during play — before first input, while the
boss hops, hides, or respawns (empty bar at 0%), while fishing, while the
book is open, and under the sleep veil; only the open pause menu overlays
it. No world-space boss bar SHALL remain.

#### Scenario: The boss bar never moves when the view changes

- **WHEN** the camera swings and the player relocates (the boss may idle in
  place)
- **THEN** the bar's screen bounding box stays put (within 1 px) while the
  camera position provably changed, and only the fill width tracks the
  boss's `slimeHud.frac`

#### Scenario: The boss bar is always visible

- **WHEN** the boss is at full health, wounded, or hidden while respawning
- **THEN** the bar remains on screen reading `12/12`, the drained fraction,
  or `0/12` respectively, with the fill colored red

#### Scenario: Every hit visibly drains the bar

- **WHEN** the player lands sword hits on the boss
- **THEN** `slimeHud.frac` drops stepwise (`11/12`, `10/12`, …), the fill
  and count follow it, and the state mirrors in
  `window.__Ghibli.snapshot().slimeHud`

## ADDED Requirements

### Requirement: Regular slimes carry flat 2D bars pinned above them

Every regular slime SHALL have a flat 2D vitality bar rendered in
screen-space directly above its projected position: fixed pixel size (no
scaling with distance beyond a clamp), no rotation or 3D billboarding —
it translates with the slime's projected position and stays a horizontal
rectangle. The bar SHALL use the gold-frame/red-fill styling, show
`hp / maxHp` of that slime, and hide when the slime is hidden, beyond
18 m, or projected off-viewport. Occlusion SHALL NOT hide the bar.

#### Scenario: The bar follows its slime without rotating

- **WHEN** a regular slime hops and the camera orbits
- **THEN** the bar stays a horizontal rectangle pinned above that slime's
  projected position (within a few px), keeping its size and styling

#### Scenario: Hidden or distant slimes hide their bars

- **WHEN** a regular slime pops (hidden) or moves beyond 18 m
- **THEN** its bar is not rendered on screen
