# landmarks Specification

## ADDED Requirements

### Requirement: Animated windmill on a mound

A windmill SHALL stand on a gaussian terrain mound at (24, −20) with a tapered
tower, red cone roof, and four lattice sails rotating at 0.6 rad/s.

#### Scenario: Sails rotate

- **WHEN** one second of scene time elapses
- **THEN** the probe's windmill angle increases by approximately 0.6 rad

### Requirement: Stone fountain plaza

The plaza center SHALL hold a stone fountain (pool ring, pedestal, bowls,
shader-rippled water discs, 40 looping ballistic droplets) with a collider
radius of 2.05.

#### Scenario: Water animates

- **WHEN** time advances
- **THEN** droplet positions follow ballistic arcs and loop continuously

### Requirement: Well, pond, trees, rocks

The scene SHALL include a stone well with bucket, a pond with lily pads and ring
rocks, at least 14 autumn trees (3 merged canopy variants), and at least 12
mossy rocks, all placed deterministically (seeded PRNG) and excluded from paths.

#### Scenario: Landmark census

- **WHEN** the scene is loaded
- **THEN** the probe reports trees ≥ 14 and rocks ≥ 12
