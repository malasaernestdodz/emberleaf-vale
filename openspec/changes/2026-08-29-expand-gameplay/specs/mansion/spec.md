# mansion Specification

## ADDED Requirements

### Requirement: Two-floor mansion with internal stairs

A two-story mansion (10×8 m, floors 0.22 / 2.95) SHALL stand west of the plaza with a
door and sand path; an internal 9-step staircase along the right wall SHALL match the
walkable ramp exactly (flat steps on the linear height ramp) with open, unpinched
sides, reaching floor 2 (back half) which overlooks the open atrium.

#### Scenario: Climb to floor 2

- **WHEN** the player starts at the stair bottom facing up and walks forward
- **THEN** they arrive at floor-2 height (2.95 ± 0.4) on the back half

### Requirement: Floor-2 colliders do not exist on floor 1

All upper-floor furniture colliders SHALL carry `y0` = floor-2 height so floor-1
movement beneath the balcony is completely unobstructed, and no grass SHALL spawn
inside the footprint.

#### Scenario: Walk under the balcony

- **WHEN** the player crosses the back half on floor 1
- **THEN** they reach the rear wall at floor-1 height with no blocking
