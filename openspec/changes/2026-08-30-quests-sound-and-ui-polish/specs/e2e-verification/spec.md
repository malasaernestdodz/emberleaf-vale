# e2e-verification Specification

## MODIFIED Requirements

### Requirement: Menu and settings coverage

The Playwright suite SHALL cover the pause menu end to end: Esc opens the menu
and freezes gameplay, the master-volume slider updates the audio snapshot and
persists across reload, the SFX and ambience toggles flip their snapshot flags,
the Test-sound button plays a sample, and Esc or the resume button closes the
menu and unfreezes gameplay.

#### Scenario: Full settings round trip

- **WHEN** the player presses Esc, drags the master slider to 40, toggles
  ambience off, clicks Test sound, and presses Esc again
- **THEN** the audio snapshot reflects master 0.4 and ambience false, gameplay
  resumes, and a reload restores the same settings

### Requirement: Quest, slime, and item-art coverage

The suite SHALL assert the quest HUD renders six slots of progress and advances
after a real flower pickup; that three frontal sword swings on the slime pop it
into gel pickups, hide it, and that it respawns after the (hook-shortened)
respawn window; and that the hotbar renders six `.slot-icon` SVGs.

#### Scenario: Slime pops into gel

- **WHEN** the player teleports next to the slime, faces it, and lands three
  left-click swings
- **THEN** the slime reports `hits` 1→2→popped, becomes invisible, gel pickups
  appear in the world, and after `skipSlimeRespawn` it respawns at its spawn
  point with `hits` reset
