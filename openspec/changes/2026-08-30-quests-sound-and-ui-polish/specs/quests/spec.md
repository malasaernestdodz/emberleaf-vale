# quests Specification

## ADDED Requirements

### Requirement: Quest log with fixed session quests

The game SHALL provide a quest log of exactly six deterministic quests — visit
the fountain plaza, collect 3 flowers, chop a tree for wood, catch a fish, pop
the slime, and sleep in a bed — each with a target count, live progress, and a
done flag, advanced only through gameplay events (`questEvent`), and completing
with a toast, a jingle, and a HUD pulse.

#### Scenario: Flower quest progresses and completes

- **WHEN** the player picks up flowers one at a time
- **THEN** the flower quest's HUD counter increments (1/3, 2/3, 3/3) and on the
  third pickup the quest is marked done, a completion toast appears, and the
  panel pulses

### Requirement: Top-right quest HUD

The quest panel SHALL be pinned to the top-right of the screen, always visible
during play (hidden while sleeping/menu), listing active quests first with
`title` and `progress/target`, and a collapsed completed count, without
blocking mouse clicks from reaching the canvas.

#### Scenario: HUD renders and does not eat clicks

- **WHEN** the world boots
- **THEN** the top-right panel shows the active quests with counters, and a
  mouse click on the canvas where the panel overlaps still swings the sword
