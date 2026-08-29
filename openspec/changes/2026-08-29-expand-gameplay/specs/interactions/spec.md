# interactions Specification

## ADDED Requirements

### Requirement: Held tool assets and animations

Contextual tools SHALL appear as visible assets attached to the character's right
hand: an axe (handle + steel head) when near a tree, a fishing rod with line when
fishing — with a swing animation for chopping (arm rotation driven by chop progress)
and a cast/reel pose while fishing.

#### Scenario: The axe is visible and swings

- **WHEN** the player stands near a tree and presses E
- **THEN** the axe becomes visible, the arm swings through chop progress, and wood is
  granted at the swing apex

### Requirement: Fishing loop with visible catch

Fishing near the pond SHALL cast a bobber that bobs, dip it when the bite window
opens (a visible fish appears on the line), and grant +1 Fish when the player reels
in during the window; early or late reels end with "It got away…".

#### Scenario: Catch a fish

- **WHEN** the player casts, waits for the bite, and reels in within 1.5 s
- **THEN** the fish asset is visible during the bite and inventory fish increments

### Requirement: Pickups, throw and inventory hotbar

Rock/flower/log/food pickups SHALL be visible world objects: E picks the nearest up,
G throws the selected item in a ballistic arc that lands and becomes pickupable
again, keys 1-5 select the hotbar slot, and counts live in the HUD hotbar.

#### Scenario: Pick up and throw

- **WHEN** the player picks up a flower then selects it (key 2) and presses G
- **THEN** inventory decrements, a thrown entity flies, lands, and the world count
  returns to its previous value

### Requirement: Food and eating

Food (bread rolls) SHALL be visible on the house and mansion dining tables as
pickups; picked-up food stores in hotbar slot 5; pressing E with food selected and
nothing else nearby SHALL eat it (consume 1, toast, and a 10 s speed boost — walk
4.2 m/s, sprint 7.4 m/s).

#### Scenario: Eat for a boost

- **WHEN** the player picks up food, selects slot 5, moves away, and presses E
- **THEN** inventory food decrements and the buff factor rises above 0.5

### Requirement: Sitting on seats

Stools and the mansion desk chair SHALL offer a "Sit down" interaction (E); while
sitting the player SHALL be placed on the seat with bent legs, movement frozen, and
"E" (or any move key) SHALL stand them back up at the spot they sat from.

#### Scenario: Sit and stand

- **WHEN** the player presses E at a stool and then presses W
- **THEN** mode is 'sit' on the seat, then returns to 'walk' grounded at the
  original spot

