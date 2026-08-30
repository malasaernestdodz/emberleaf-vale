# Prop Models Specification

## Purpose

Every placeable prop (houses, doors, frames, furniture, landmarks) is built from
shared world constants so meshes, colliders, and tests can never drift apart.
This spec exists because door leaves, frames, and openings were previously
hard-coded with magic numbers in scene files and repeatedly misaligned.

## Requirements

### Requirement: Single source of truth for prop dimensions

Prop dimensions (openings, leaves, frames, floors, pads) SHALL be exported from
`src/lib/world.ts` and consumed by both the scene components and the e2e math
specs. Scene files SHALL NOT hard-code prop dimensions that also exist as world
constants.

#### Scenario: Door assembly constants

- **WHEN** a door is added to any building
- **THEN** the opening width/height, hinge position, leaf depth, swing, and
  frame offsets are exported from `src/lib/world.ts` (e.g. `HOUSE_DOOR`,
  `MANSION_DOOR`)
- **AND** the scene builds the leaf through the shared builder in
  `src/scene/door.ts` instead of an inline translated box

### Requirement: Door leaves fill their wall openings

A door leaf SHALL span the full width and height of its wall opening, hinged at
one jamb edge, so a closed pose would cover the opening edge to edge.

#### Scenario: Leaf matches opening

- **WHEN** an opening of width W and height H is cut into a wall
- **THEN** the leaf is W wide and H tall with its hinge at the opening edge

### Requirement: Open doors rest flat against the interior wall

A visually open door SHALL swing inward and rest nearly flat against the
interior wall face, recessed so no part of the leaf intersects the wall band,
the frame trim, or the walk corridor through the doorway.

#### Scenario: Open pose clears the doorway

- **WHEN** the leaf rests in its open pose
- **THEN** the leaf segment stays clear of the player capsule sweeping the
  doorway center line and of every furniture collider inside the room

### Requirement: Frames flank openings

Jamb posts and lintels SHALL sit outside the opening edges (flush with the wall
seams), never standing inside the walkable opening.

#### Scenario: Jamb posts do not block

- **WHEN** jamb posts are placed for an opening spanning [a, b]
- **THEN** the left post's inner face is at or left of a and the right post's
  outer face at or right of b

### Requirement: Props have handles and readable detail

Door leaves SHALL include bracing and a handle in the merged leaf geometry so
the prop reads as a door from every gallery angle.

#### Scenario: Leaf carries detail geometry

- **WHEN** `buildDoorLeaf` merges the leaf parts
- **THEN** the merged geometry contains the panel, two braces, and a through
  handle
