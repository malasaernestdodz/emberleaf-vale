# e2e-verification Specification (delta)

## ADDED Requirements

### Requirement: Camera zoom regression coverage

The Playwright suite SHALL include `e2e/camera.spec.ts` with pure-math
invariants for `obbWall`/`circleWall` (inside exit distance, outside entry
distance, `Infinity` on miss, finite indoor clamps in every direction, outdoor
clamp leaving the camera outside the real footprint, entry monotonic in the
margin) and a browser journey over the `__Ghibli` snapshot (which SHALL expose
`game.interior`): walk into the house, assert indoor camera bounds while
zooming in/out and orbiting, walk out, assert an unoccluded player→camera
segment at every polled frame after exit, and assert the full zoom distance is
restored with the camera outside the footprint.

#### Scenario: End-to-end house zoom journey

- **WHEN** the player walks into the house through the door, zooms and orbits
  indoors, then walks out through the door and away from the house
- **THEN** the camera stays inside the house bounds while indoors at every
  zoom level, the exiting segment never crosses the footprint below the wall
  top, and the final player-to-camera distance exceeds 4.5 with `interior`
  below 0.05

### Requirement: Structural camera drift guards

The ast-grep rule set SHALL fail the build when the validated camera behavior
is removed or bypassed: the indoor `obbWall` clamp, the windmill `circleWall`
clamp, the outdoor occlusion dolly, the `damp(game.interior, ...)` easing, and
the wheel `camDist` clamp must remain present in their files, and unguarded
`interior > 0.5` position clamps, direct `camera.position.set` calls, and
snapped `game.interior = 0/1` assignments must remain absent. The camera
targeting rules SHALL use the `Tsx` language so they apply to `.tsx` sources.

#### Scenario: Removing the outdoor occlusion clamp fails CI

- **WHEN** any change deletes the outdoor occlusion dolly
  (`allowed = Math.min(allowed, Math.max(wall - 0.5, 0.8))`) from
  `src/scene/CameraRig.tsx`
- **THEN** `npm run lint:sg` exits non-zero reporting
  `camera-outdoor-occlusion-required`

### Requirement: CI order and strictness

CI SHALL run, in order: strict OpenSpec validation
(`openspec validate --all --strict`), the ast-grep structural scan, the
type-check + build, the dedicated camera regression Playwright spec, and then
the full Playwright suite on SwiftShader WebGL.

#### Scenario: Camera regression gates a PR before the full suite

- **WHEN** a PR breaks the house indoor↔outdoor zoom
- **THEN** the dedicated camera step fails first with the camera spec's
  failing assertion and the full suite step does not run
