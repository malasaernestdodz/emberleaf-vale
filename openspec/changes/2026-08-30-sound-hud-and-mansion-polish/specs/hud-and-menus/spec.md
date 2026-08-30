# hud-and-menus Specification

## ADDED Requirements

### Requirement: Game flow states

The game SHALL expose flows `title`, `play`, `paused`. `?lite` SHALL boot directly into
`play` with low quality and no title screen. Esc (pointer-lock exit or keydown) and `P`
SHALL toggle `play ⇄ paused`. While paused, gameplay frame updates (player physics,
timers, tree animation, interactions) SHALL be frozen, but rendering continues.

#### Scenario: Boot to title
- **WHEN** the app loads without `?lite`
- **THEN** the title screen shows over the live valley with Start and Settings

#### Scenario: Pause freezes gameplay
- **WHEN** the user presses Esc during play
- **THEN** the pause menu opens, the player/trees/toast timers freeze, and the world still renders

#### Scenario: Resume re-locks the pointer
- **WHEN** the user clicks Resume while pointer lock was previously held
- **THEN** the menu closes and pointer lock is re-requested from that click

### Requirement: Settings panel

The settings panel (reachable from title and pause) SHALL provide: Master/Music/SFX
sliders with numeric % and a live level meter, a mute toggle, a quality segmented control
(Low/Medium/High), and an FPS-counter toggle. Quality SHALL drive render scale (DPR 1 /
≤1.25 / ≤1.75), shadow map (off / 1024 / 2048), bloom (off / on / on), and MSAA
(0 / 2 / 4). Settings SHALL persist to `localStorage` and reapply on load. In `?lite`
quality SHALL be pinned to Low.

#### Scenario: Quality change
- **WHEN** the user switches quality Medium → Low
- **THEN** the canvas remounts with dpr 1, shadows off, and no bloom, and the choice persists across reloads

#### Scenario: Volume indicator
- **WHEN** any volume slider moves
- **THEN** its numeric % and meter update live and the HUD volume chip mirrors the master level

### Requirement: Themed HUD

The HUD SHALL be a themed interface (angular corner-cut panels, ember-gold accent,
uppercase tracking, tabular numerals) containing: a location cluster (title + zone
badge), a status cluster (fps/draws chip gated by the fps setting, a volume chip with
level bars reflecting master volume/mute, a settings gear button), a center crosshair
only while pointer-locked, an interaction prompt with a key chip, toasts, and a hotbar
with SVG item glyphs, counts, slot keys, and active-slot highlight. The book, veil, and
`window.__Ghibli` behaviors SHALL be unchanged.

#### Scenario: HUD reflects state
- **WHEN** the player stands near a tree with 1 of 3 chops done
- **THEN** the prompt reads `Chop the tree (1/3)` with the `E` key chip

#### Scenario: Volume chip
- **WHEN** the master volume is 60 %
- **THEN** the HUD volume chip shows 3 of 5 level bars, and 0 bars plus a slash when muted
