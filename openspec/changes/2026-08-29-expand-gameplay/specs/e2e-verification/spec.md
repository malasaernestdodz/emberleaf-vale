# e2e-verification Specification (delta)

## ADDED Requirements

### Requirement: Pure-math validation of the height field

A Node-run spec (`e2e/math.spec.ts`) SHALL import the world module directly and
assert: house/mansion floor heights, mansion stair monotonicity and arrival at
floor 2, windmill spiral monotonic rise with seam-free door wedge and top balcony,
center shaft openness, fountain rim/water heights, well rim/bottom, finite and
bounded heights across the world.

#### Scenario: Math suite green

- **WHEN** `npx playwright test e2e/math.spec.ts` runs
- **THEN** all height-field invariants hold without a browser

### Requirement: Structural scan via ast-grep

`npm run lint:sg` SHALL run ast-grep rules that fail on `Math.random()` inside
`src/**` (determinism convention) and on any 3-argument `resolveCollisions` call
(height-aware collision requires the feet argument).

#### Scenario: Structural scan green

- **WHEN** `npm run lint:sg` runs
- **THEN** zero findings are reported
