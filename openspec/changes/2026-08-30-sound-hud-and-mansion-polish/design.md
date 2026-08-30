# Design: Sound, menu/HUD states, falling trees, mansion depth

## Context

Constraints from `openspec/project.md`: strict TS, no comments, seeded determinism, zero
per-frame allocations, `window.__Ghibli` test hooks, `?lite` e2e mode, npm.cmd on Windows.
Existing E2E pins behaviors this change must not break:

- `chopping a tree yields wood with the axe`: one `E` press → `inv.wood >= 1` within 2 s.
- `pickup, inventory and throw`: exactly 23 alive pickups before any tree falls.
- `boots with perf budgets`: `drawCalls <= 190`, `grass >= 10000`, `trees >= 14` in lite.
- No test ever pointer-locks or presses Escape, and `?lite` never shows blocking UI.

## Goals / Non-Goals

- Goals: audible, responsive, stateful shell (title/pause/settings); tactile chopping with
  a real fall; glass that reads as glass; mansion massing that reads "manor".
- Non-Goals: no audio asset downloads (all synthesized), no physics engine for the fall
  (authored rotation curve is deterministic and cheap), no PBR overhaul (toon ramp stays),
  no guns/combat content, no multiplayer.

## Decisions

### D1. Audio: one lazy WebAudio graph, buses, seeded variation
`lib/audio.ts` owns a module singleton created on first user gesture (`onFirstInput`).
Graph: `ctx → master → destination`, `music → master`, `sfx → master`. Every voice is a
short builder function (`osc`/`noise` + gain envelope + optional filter). Variation uses
`mulberry32(audioSeed)` advanced per play — no `Math.random()` (ast-grep rule). All public
entry points (`sfx.play(name)`, `ambience.start()`, `music.start()`) no-op when the
context is missing or `suspended` so headless e2e (SwiftShader, possibly no audio device)
is unaffected. Footstep cadence is driven from the Player frame loop by accumulated
ground distance, not wall time. Ambience wind = looped band-passed noise with a slow LFO;
birds = seeded random scheduled chirps; music = a slow pentatonic pad (two detuned
triangles through a low-pass) with seeded sparse plucks. Volumes come from settings and
are applied on the gain nodes on every change.

*Alternatives considered:* HTML `<audio>` asset bank (rejected: violates "everything
procedural", adds downloads); per-sound `<Audio>` components (rejected: no three audio
needs, DOM/WebAudio is lighter).

### D2. Settings store: plain observable module + localStorage
`lib/settings.ts` holds `{ master, music, sfx (0..1), muted, quality: 'low'|'medium'|'high',
showFps }` with `load()` (localStorage `emberleaf.settings.v1`, merge over defaults, clamp)
and `subscribe()`. React reads it via `useSyncExternalStore`-style subscription in the UI.
Quality maps: low → dpr 1, shadows off, no bloom, MSAA 0; medium → dpr ≤1.25, shadows
1024², bloom, MSAA 2; high → dpr ≤1.75, shadows 2048², bloom, MSAA 4. `?lite` pins low and
hides the title. Changing quality remounts the `<Canvas key>` (rare, explicit user action)
because shadow map size and DPR are creation-time-ish state in fiber.

### D3. Game states live in `game`, UI mirrors them
`game.flow: 'title' | 'play' | 'paused'` + `game.paused` boolean. The frame loops gate on
`game.paused` only (title keeps rendering the live valley behind the menu — the menu is a
scrim). Esc while pointer-locked: browser exits lock → `pointerlockchange` opens pause.
Esc while unlocked (or `P`) toggles pause directly. `?lite` starts in `play` with no
title. Resume re-requests pointer lock from the click (user gesture). UI code never
mutates gameplay fields other than `flow`/`paused`.

### D4. Trees: individual meshes over instancing, authored fall curve
18 trees × 3 shared variant geometries = 18 draw calls (was 1 merged). That is the price
for per-tree rotation, and it keeps us ~60 draws under budget. `lib/trees.ts` holds
parallel state `{ hits, state: 'up'|'fall'|'down'|'grow', t, dir, seed }[]` plus pure
helpers (`swingRegistered`, `fallAngle(t)`) so it is testable. The fall rotates the tree
group around its base on a horizontal axis pointing away from the player
(`dir = atan2(tree.x - px, tree.z - pz)` at hit time), angle = ease-in cubic to 88° over
1.4 s with a damped bounce on landing. Colliders: `world.ts` now exports
`treeColliderRefs: Collider[]` (same order as `TREES`); a fallen tree sets `r = 0.06`
(walk past the trunk), regrow restores it. Each completed swing still grants +1 wood at
50 % swing progress (keeps the E2E chop contract), 3rd hit starts the fall and drops 2
bonus wood pickups via the existing `spawnPickup`. Prompt label becomes
`Chop the tree (n/3)`.

### D5. Glass: one shared physical material + PMREM mini-sky
`scene/textures.ts` builds, once and lazily, (a) a 128² RGB noise **normal map**
DataTexture (`makeNoiseNormalMap`) for plaster/roof relief, and (b) `makeGlassEnv(renderer)`
— a 64² gradient sky dome + sun blob + ground plane rendered through `PMREMGenerator` into
an env texture assigned to a shared `MeshPhysicalMaterial` (`transparent, opacity 0.30,
roughness 0.06, metalness 0.05, clearcoat 1, envMapIntensity 1.5, warm faint emissive,
depthWrite false`). House/Mansion swap their `meshBasicMaterial` sticker for this material
plus real mullion bars. The env is built inside a tiny `<SceneEnv/>` component (needs the
renderer) mounted in `World`; `scene.environment` stays untouched so toon materials are
unaffected.

### D6. Mansion depth, all in merged buckets
Portico (4 columns, pediment, platform + steps) on the front axis of the door, balcony
slab + balustrade above it, corner quoins, full-perimeter string course at floor-2 level
and a roof cornice, two chimneys with caps, pediment + sill trim on every `addWin`, small
dormers on the front roof slope. All geometry joins the existing color buckets so the
mansion stays ~10 draw calls; normal map applies to the plaster and roof buckets only.
New geometry is decorative only — no collider or walkable changes, so all E2E collision
and camera-clamp tests hold.

### D7. HUD/menu retheme without breaking hooks
DOM tests hook `.book`, `.veil`, `__Ghibli` only — safe to restyle everything else. New
`ui/Hud.tsx` + `ui/Menu.tsx` render from a 150 ms poll of `game` (same as today's App
loop). Angular corner-cut panels via `clip-path`, ember-gold accent, uppercase tracking,
tabular numerals, inline SVG glyphs for hotbar items and the volume chip (3-level bars).
Debug coords move inside the fps chip (toggleable). Title = world scrim + logo + menu;
pause = centered column (Resume/Settings/Quit-to-title); settings = modal with slider
rows (value % + live meter), quality segmented control, fps toggle, controls reference.

## Risks / Trade-offs

- 18 tree draw calls (was 1): accepted, budget headroom is large (lite run ≈ 108 + 17).
- Canvas remount on quality change (~1 s hitch): accepted, explicit rare action.
- Procedural music/ambience can sound sparse: intentional — bed + chirps, not a score.
- Normal map on toon bands could shimmer: strength kept low (0.35), repeat coarse.
- Fallen-tree bonus wood changes pickup count mid-run: only after 3 swings, and the exact
  count (23) E2E assertion runs before any chop in the suite order.
