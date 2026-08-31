# combat-health Specification

## ADDED Requirements

### Requirement: Right-click is an instant fast slash

Pressing the right mouse button SHALL attack immediately on press: the slime
hit check runs that same frame, a swing sound plays, and the blade plays a
short slash animation (~0.22 s). A new right-click during a slash SHALL
restart the slash and re-run the hit check with no lockout, so repeated
clicks read as rapid slashes. The left button SHALL keep the committed 0.9 s
heavy swing with its existing lockout. The active swing duration SHALL be
exposed as `attackDur` in `window.__Ghibli.snapshot()`.

#### Scenario: A right-click lands instantly

- **WHEN** the player right-clicks while facing the slime within 1.45 m
- **THEN** the slime's HP drops by 1 within the next snapshot polls, the
  snapshot reports `attackDur` of 0.22 for the slash, and gel pops on the
  third hit

#### Scenario: Rapid slashes keep landing

- **WHEN** the player right-clicks repeatedly at close range
- **THEN** each click restarts the slash and re-runs the hit check, so HP
  falls 3 → 2 → 1 → 0 without waiting out any animation lockout

#### Scenario: The heavy swing is unchanged

- **WHEN** the player attacks with the left button
- **THEN** the swing lasts the heavy duration (snapshot `attackDur` of 0.9)
  and cannot be re-triggered until it finishes

#### Scenario: Swings obey the hit arc

- **WHEN** the player attacks while facing away from the slime or beyond
  1.45 m
- **THEN** the swing plays but the slime's HP is unchanged

#### Scenario: UI and stale buffers never swing

- **WHEN** the player right-clicks on `.clickable-ui` chrome, during the
  pause menu, the book, fishing, sitting, or fainting — even if the frame
  loop stalls for seconds and no discard can run
- **THEN** no attack fires, because click edges older than ~150 ms expire
  on their own and never fire when the state ends
