# combat-health Specification

## ADDED Requirements

### Requirement: The hero carries ember hearts

The hero SHALL have 5 hearts of health. Any damage the hero takes SHALL cost
whole hearts, knock the hero away from the source, flash a red vignette, play a
hurt sound, and grant 1.2 s of invulnerability so one bump can never cost more
than one heart.

#### Scenario: Slime contact costs exactly one heart

- **WHEN** the slime touches the hero or its hop lands within 1.35 m of the
  hero
- **THEN** the hero loses exactly 1 heart, is knocked back, and further
  contact within the next 1.2 s costs nothing

### Requirement: The vale mends what time hurts

After 10 s without damage the hero SHALL regrow 1 heart every 4 s. Eating food
SHALL mend 2 hearts immediately, and finishing a sleep SHALL restore all
hearts.

#### Scenario: Hearts regrow after a quiet rest

- **WHEN** the hero takes damage and then avoids harm
- **THEN** after about 10 s hearts regrow one at a time every 4 s until full

### Requirement: Fainting returns the hero to the spawn shrine

When the hero's hearts reach zero the hero SHALL faint: input is frozen behind
a deep-red veil, and after about 3.2 s the hero wakes at the spawn shrine with
full hearts and brief invulnerability.

#### Scenario: Zero hearts faints and restores

- **WHEN** the hero's hearts reach 0
- **THEN** the veil covers the screen, and the hero wakes at the spawn shrine
  with 5/5 hearts
