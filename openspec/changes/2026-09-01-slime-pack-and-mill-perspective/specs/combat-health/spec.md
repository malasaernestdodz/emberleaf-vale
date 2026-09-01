# combat-health Specification

## MODIFIED Requirements

### Requirement: A pack roams the vale and a boss guards the pond

The vale SHALL host 3 regular slimes (each with the existing hop/windup/
contact behavior, independent spawns and 20 s respawns) and 1 big boss
slime (2.2× body, 12 HP, slower windup, 2.2 m landing splash with stronger
knockback, 6 gel on pop, 90 s respawn). Any click attack SHALL damage
exactly ONE slime — the first victim inside its 1.45 m frontal arc
(regulars first, then the boss) — with the instant restart/combo chain
semantics already specified. Contact damage SHALL be 1 heart per touch
with the global 1.2 s invulnerability, so a pack can never multi-tap.

#### Scenario: One slash, one victim

- **WHEN** two regular slimes stand within reach and the player attacks
- **THEN** exactly one slime loses 1 HP (the first in the arc), the other
  is untouched, and the slash anim plays once

#### Scenario: The boss takes and deals more

- **WHEN** the player slashes the boss or the boss's landing splashes near
  the player
- **THEN** the boss drains 1 HP per hit (12 to pop), and its landing splash
  costs 1 heart with a stronger knockback than a regular slime's

#### Scenario: Pops are independent

- **WHEN** a regular slime pops while the boss is alive
- **THEN** the boss is unaffected, the popped slime respawns at its own
  spawn after ~20 s, and the boss returns ~90 s after its own pop with a
  6-gel fountain
