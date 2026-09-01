# combat-health Specification

## MODIFIED Requirements

### Requirement: Any button is an instant fast combo slash

Pressing either mouse button SHALL attack immediately on press: the slime
hit check runs that same frame, a swing sound plays, and the blade plays a
short horizontal slash animation (~0.25 s). A new press during a slash
SHALL chain into the next combo hit — restarting the swing and re-running
the hit check with no lockout — and consecutive chained presses SHALL
alternate the swing direction (right→left, then left→right, Zelda-style);
a press after the ~1.1 s combo window SHALL reset the chain to the first
stage. Blocked states (pause menu, book, fishing, sitting, fainting,
mid-chop) SHALL reset the chain and never swing, and click edges older than
~150 ms SHALL expire on their own. The committed heavy swing SHALL be
removed; the active swing duration SHALL be exposed as `attackDur` and the
combo state as `slash: { stage, dir, active }` in
`window.__Ghibli.snapshot()`.

#### Scenario: A click lands instantly

- **WHEN** the player clicks while facing the slime within 1.45 m
- **THEN** the slime's HP drops by 1 within the next snapshot polls, the
  snapshot reports `attackDur` of 0.25, and gel pops on the third hit

#### Scenario: Rapid clicks chain with alternating direction

- **WHEN** the player clicks repeatedly within the combo window
- **THEN** each click restarts the swing, HP falls 3 → 2 → 1 → 0, and
  `slash.dir` alternates between chained hits

#### Scenario: A late press opens a fresh chain

- **WHEN** the player waits past the combo window and clicks again
- **THEN** the chain resets to the first stage (`slash.stage` 0)

#### Scenario: Swings obey the hit range

- **WHEN** the player attacks far from the slime (beyond the 1.45 m hit
  range, e.g. across the plaza)
- **THEN** the swing plays but the slime's HP and hit count are unchanged

#### Scenario: UI and stale buffers never swing

- **WHEN** the player clicks on `.clickable-ui` chrome, during the pause
  menu, the book, fishing, sitting, or fainting — even if the frame loop
  stalls for seconds and no discard can run
- **THEN** no attack fires, the chain resets, and expired clicks never
  fire when the state ends
