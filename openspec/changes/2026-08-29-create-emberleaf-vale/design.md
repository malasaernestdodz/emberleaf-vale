# Design — Emberleaf Vale

## 1. Stack research (what "high performance 3D in 2026" means here)

Verified against the npm registry on 2026-08-29:

- **three.js 0.185.1** — still the runtime standard. The 2026 headline path is
  `WebGPURenderer` + TSL node materials, but the React ecosystem's post-processing
  chain (`@react-three/postprocessing` 3.1.1 / `postprocessing` 6.39.4) is still
  WebGL-first, and SwiftShader E2E testing of WebGPU is unreliable. **Decision:**
  WebGL2 + heavy GPU instancing now; keep all custom shading in plain GLSL
  `ShaderMaterial`s so a WebGPU/TSL port later touches renderers, not gameplay.
- **@react-three/fiber 9.7** — React 19 reconciler for three; scene graph lives in
  React, per-frame work stays in `useFrame` with zero allocations.
- **Performance levers actually used:**
  1. Grass = **one draw call** (~70k blades, `InstancedBufferGeometry` + custom
     vertex-shader wind; no `InstancedMesh` matrix overhead).
  2. Trees/rocks/lily pads = **merged static world-space geometry** (1 mesh each).
  3. `MeshToonMaterial` + 4-step gradient ramp = stylized look without PBR cost.
  4. One shadow-casting directional light with a tight ortho frustum (±30).
  5. `dpr` clamped to [1, 1.75], ACES tone mapping, additive-free bloom.
  6. Framerate-independent damping everywhere (see §4).

## 2. World layout (single source of truth: `src/lib/world.ts`)

All constants live in one module so collision, terrain, scatter, and tests agree.

```
SPAWN    (0, 12)   on the main path, facing the plaza
PLAZA    (-6, -1)  r=6 flattened stone circle; FOUNTAIN at its center
HOUSE    (12, -10) 7m × 6m, yaw -1.107 rad, door on plaza-facing wall
WINDMILL (24, -20) gaussian mound (+2.6m), sails rotate
WELL     (-13, 5)  stone ring + posts + pyramid roof + bucket
POND     (-17, 12) r≈5.6 water disc, bed at -0.62, lily pads, ring rocks
WORLD_R  90        soft play-area border
```

Sand paths = Catmull-Rom curves flattened to polylines (main: spawn → plaza →
door front; branches: plaza → well, plaza → pond). `pathDistance(x, z)` is
point-to-segment distance over the sampled polyline and is reused by terrain
coloring, terrain flattening, and grass/flower exclusion.

## 3. Terrain mathematics

- `terrainHeight(x, z)` is the **single analytic function** used by the mesh,
  the player, the camera, and every scatter pass:
  - base: two fbm octave sets (amplitudes 2.6 + 0.5) → rolling hills;
  - mound: gaussian bump at the windmill;
  - flatten masks: smoothstep radial falloff around house/plaza/well/windmill
    (each with its own target height, e.g. windmill → mound-top height);
  - path mask: `lerp(h, 0, 0.92 * (1 - smoothstep(1.7, 3.6, pathDistance)))`;
  - pond bowl: radial mask → −0.62.
- Vertex colors (JS, once at build): grass green fbm mottling + autumn patches,
  sand on the path mask, stone in the plaza, dark sand in the pond bowl.
- Player Y = `terrainHeight` (house footprint uses the flat floor height), so
  walking uphill just works with no physics engine.

## 4. Character controller (`Player.tsx` + `collide.ts`)

Kinematic capsule (r = 0.32), no physics engine:

- Input: camera-relative. `forward = (-sin camYaw, -cos camYaw)`,
  `right = (-forward.z, forward.x)`; arrows and WASD both work; Shift = run
  (walk 3.4 m/s, run 6.2 m/s, 2.0 m/s inside the pond radius).
- Velocity smoothing: `v = damp(v, target, 10, dt)` — framerate-independent.
- Heading: `dampAngle` with shortest-arc wrapping (no 359°→0° spins).
- Collision resolution (3 passes): circles (trees, well, fountain, windmill,
  rocks, table) push out radially; walls are **OBBs** — transform into box-local
  space, push along the minimum-penetration axis, transform back. The front wall
  is split into two boxes, leaving a 1.3 m door gap = the doorway.
- dt clamped to ≤ 50 ms (tab-switch spikes cannot tunnel through walls).
- Border: soft radial clamp at WORLD_R − 4.

## 5. Camera rig (the "eye / view look" mathematics)

- Spherical follow: `camPos = target + (sin yaw·cos pitch, sin pitch, cos yaw·cos pitch) · dist`,
  `target = playerPos + (0, 1.4, 0)`.
- Position damped at k=7, look-target damped at k=12 (separate smoothers so the
  camera leads slightly — standard third-person feel).
- Drag: yaw −= dx·0.0052, pitch += dy·0.0045, pitch ∈ [0.08, 1.25]; wheel zoom
  dist ∈ [3, 11]; inside the house dist eases to ≈0.35× (≈2.3) and the camera is
  clamped inside the house footprint so it never clips walls or the roof.
- Camera never clips terrain: `camY = max(camY, terrainHeight(camX, camZ) + 0.35)`.
- `lookAt` via three's matrix math; no Euler-gimbal issues because yaw/pitch are
  explicit spherical coordinates.

## 6. Grass system (signature feature)

- Base: `PlaneGeometry(0.10, 1, 1, 3)` pivoted at the root, instanced ~70k×.
- Per-instance attributes: offset (vec3), yaw, scale, phase, colorMix.
- Vertex shader: yaw rotation, tip-weighted wind sway
  (`uv.y^1.5 · (two sines + slow gust field) · bendW`), plus **player-bend**:
  blades within 1 m of the player push radially away — the meadow reacts to you.
- Fragment shader: root→tip gradient with autumn hue mixing and fake AO
  (`mix(0.55, 1.05, uv.y)`); distance fog matched to the scene fog.
- Scatter: rejection sampling (seeded) excluding path/plaza/house/pond/landmarks;
  flowers are a free subset of accepted grass positions.

## 7. House + interior

- Lavender plaster walls with dark timber frames, red bell-curve lathe roof,
  glowing amber windows (bloom picks them up), open door mesh, chimney.
- Interior: wood floor, rug, table + stools + teapot, bed, bookshelf, lantern
  with a warm `PointLight`. Furniture has colliders.
- `inside` = point-in-OBB footprint test; drives the camera-distance easing and
  the interior-light mix exposed on the probe.

## 8. Landmarks & atmosphere

- Windmill: tapered tower + red cone roof + 4 lattice sails rotating at 0.6 rad/s
  (angle on the probe for the animation test).
- Fountain: stone pool/pedestal/bowls, shader-rippled water discs, 40 ballistic
  CPU droplets looping through the jet.
- Well, pond (fresnel-ish ripple shader, lily pads), autumn trees (deformed
  icosahedron canopies, 3 variants), mossy rocks, falling instanced leaves,
  8 CPU butterflies, sky dome with fbm clouds + sun glow.

## 9. Probe + E2E strategy

- `window.__Ghibli.snapshot()` returns plain JSON each frame: player x/y/z +
  house-local coords, heading, cam yaw/pitch/dist/pos, `inside`, windmill angle,
  fps, grass count, draw calls, triangles, object counts; `teleport(x, z)` and
  `setCamYaw(y)` exist **only** as test hooks (real input still drives movement).
- Playwright: chromium with `--use-angle=swiftshader --enable-unsafe-swiftshader`
  (headless WebGL2). Suite asserts: boot+probe live → arrow-key displacement &
  camera follow → drag orbit + zoom → wall blocking (house-local coords stay in
  bounds) → walk in through the door and back out → windmill animates → perf
  budgets (grass ≥ 40k, draw calls ≤ 120) → screenshots for human review.
- Server lifecycle: Playwright `webServer` runs `vite preview` on :4173.

## 10. Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| `npm.ps1` blocked by execution policy | Use `npm.cmd` everywhere |
| Headless WebGL fails | SwiftShader flags; probe `ready` timeout 30 s |
| TS 6 + R3F v9 friction | Conservative tsconfig, `tsc --noEmit` gate in build |
| Grass too heavy on weak GPUs | Count is one constant; shader is branch-light |
| Camera through walls indoors | Interior distance easing + terrain clamp |

## 11. Alternatives considered

- **Rapier physics** — rejected: deterministic, tunable kinematic motion is
  simpler and faster for a walking sim; colliders here number in the dozens.
- **WebGPU/TSL now** — rejected for v1: post-processing and SwiftShader testing
  are WebGL-first; GLSL is kept portable for a later swap.
- **drei helpers (Sky, Clouds, Instances)** — rejected: custom shaders are
  smaller, cheaper, and exactly Ghibli-tuned; fewer dependencies.
- **Heightmap textures / GLTF assets** — rejected: analytic + procedural keeps
  the repo self-contained and deterministic.
