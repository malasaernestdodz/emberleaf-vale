# sound-system Specification

## ADDED Requirements

### Requirement: Procedural sound effects

The game SHALL play short procedural WebAudio sound effects — swing, slime
hit, slime pop, pickup, throw, chop, fishing splash/bite/reel, eat, sleep
chime, quest jingle, UI click, and slime hop — synthesized at runtime from
oscillators and filtered noise with zero downloaded audio assets, routed
through a master gain node.

#### Scenario: Swing plays a whoosh

- **WHEN** the player left-clicks to swing the sword
- **WHILE** the sound system is enabled
- **THEN** a short filtered-noise whoosh is audible and the audio snapshot
  reports the last effect as `swing`

### Requirement: Ambience bed

The game SHALL loop a quiet procedural ambience bed (filtered-noise breeze
with slow gain/filter wobble plus occasional seeded bird chirps), togglable
independently of SFX and mixed through the same master gain.

#### Scenario: Ambience toggles off

- **WHEN** the ambience toggle is switched off in the menu
- **THEN** the breeze/chirp graph is disconnected and the snapshot reports
  `ambience: false`

### Requirement: Persisted sound settings

Sound settings — master volume (0–100), SFX on/off, ambience on/off — SHALL be
adjustable from the in-game menu, persisted to localStorage under
`ev-audio-v1`, and restored on the next boot; the menu SHALL provide a
Test-sound button that plays an audible sample.

#### Scenario: Volume slider persists across reload

- **WHEN** the player sets master volume to 40 in the menu and reloads
- **THEN** the restored menu shows the slider at 40 and the snapshot reports
  `audio.master` as 0.4
