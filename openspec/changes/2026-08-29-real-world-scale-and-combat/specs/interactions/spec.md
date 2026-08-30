# interactions Specification

## ADDED Requirements

### Requirement: Sword is the default tool with left-click attack

The character SHALL carry a sword by default (visible in the right hand whenever
no rod/axe is active); a left click SHALL swing it over 0.45 s — the right arm
pivots through a sin-eased arc driven by `game.attack` (0→1 progress) — and the
swing SHALL be cancellable only by fishing, chopping, sitting, or an open UI.

#### Scenario: Left click swings the sword

- **WHEN** the player left-clicks the world
- **THEN** `snapshot().tool` is `sword`, `game.attack` rises above 0 and returns
  to 0 within ~0.5 s, and the arm/sword animate through the swing
