# audio-system Specification

## ADDED Requirements

### Requirement: Procedural WebAudio graph

The system SHALL implement all audio procedurally with the WebAudio API and no asset
downloads. The graph SHALL be `context → master gain → destination` with `music` and
`sfx` child gains, and SHALL be created lazily on the first user gesture. Every audio
entry point SHALL be a safe no-op when the context is absent or suspended (headless e2e).

#### Scenario: First gesture unlocks audio
- **WHEN** the user produces the first key/click input
- **THEN** the audio context is created or resumed and ambience/music start

#### Scenario: No gesture yet
- **WHEN** `sfx.play(...)` is called before any user gesture
- **THEN** nothing throws and nothing is scheduled

### Requirement: Sound coverage for interactions

The sfx bank SHALL cover: footsteps (rate tied to movement speed), axe swing, axe hit,
tree creak, tree fall crash, landing thud, pickup, throw, eat, fishing cast, bite, reel,
catch, miss, sleep chime, wake chime, book page, sit down, UI hover, UI click, toast
blip. Each voice SHALL support pitch/volume variation derived from the seeded PRNG
(`mulberry32`) — `Math.random()` is forbidden in `src/**`.

#### Scenario: Chopping sounds
- **WHEN** the player completes an axe swing at a tree
- **THEN** a swing whoosh plays on windup and a knock on contact

#### Scenario: Tree fall sounds
- **WHEN** a tree starts to fall
- **THEN** a creak plays, followed by a crash + thud when it lands

### Requirement: Ambience and music

The system SHALL provide a continuous wind bed (filtered noise with slow LFO), seeded
random bird chirps, and a slow seeded pentatonic music pad. Ambience and music route
through the `music` bus.

#### Scenario: Ambience always present in play
- **WHEN** the game is in `play` flow with volume > 0
- **THEN** wind and occasional birds are audible without repetition glitches

### Requirement: Volume control buses

Settings SHALL expose master, music, and sfx levels (0–1) plus a mute flag; changing any
of them SHALL take effect immediately on the gain nodes without recreating the context.
The `M` key SHALL toggle mute.

#### Scenario: Master slider change
- **WHEN** the user drags Master to 30 %
- **THEN** all audio output scales to 30 % immediately and the HUD volume chip reflects it
