# Change: Sound, menu/HUD states, falling trees, mansion depth

- **Date:** 2026-08-30
- **Type:** Feature expansion (audio, UI shell, interaction feel, visual fidelity)

## Why

User feedback after the playable valley build:

1. The world is silent end to end — no footsteps, chops, pickups, UI feedback, ambience,
   or music, and there is no volume control anywhere.
2. The app boots straight into the scene with only a hint strip: no title menu, no pause,
   no settings (volume indicators, quality, fps counter), no coherent menu → play → pause
   state flow.
3. The HUD is a debug readout, not a themed interface.
4. Window "glass" is a flat glowing yellow sticker — it does not read as glass.
5. Chopping a tree grants wood instantly with no visible reaction — trees should take
   multiple swings, shake, and actually **fall over** before yielding (and regrow later).
6. The mansion reads as a plain box with a pyramid: it needs architectural depth
   (portico, balcony, cornices, quoins, chimneys, window trim, surface relief/normal
   detail) while keeping the toon look and the fps budget.

All of it must stay deterministic (seeded PRNG only), allocation-free in the frame loop,
and inside the existing perf budget (`drawCalls <= 190` in lite e2e).

## What Changes

- **Audio system (fully procedural, zero assets):** one WebAudio graph with
  master → {music+ambience, sfx} buses. SFX bank: footsteps (speed/rate aware), axe
  swing/hit, tree creak + fall crash + landing thud, pickup/throw/eat pops, fishing
  cast/bite/reel/catch, sleep/wake chimes, book page turn, sit, UI hover/click ticks,
  toast blip. Ambience: filtered-noise wind bed + random seeded bird chirps. Music: slow
  seeded pentatonic pad. Unlocks on first user gesture; every call is a safe no-op before
  that or when the context is unavailable.
- **Menu / game states:** `title → playing ⇄ paused` shell. Title screen (start, settings,
  controls). Pause on Esc (pointer-lock exit or key) with resume/settings. Settings panel:
  Master/Music/SFX sliders with live numeric % and level meter, mute (M key + HUD chip),
  quality (Low/Medium/High — drives DPR, shadow map size, bloom, MSAA), FPS counter
  toggle. All persisted to `localStorage`. `?lite` (e2e) boots straight into playing with
  low quality and skips the title.
- **HUD retheme (clean angular "tactical" language, ember-gold accent, no guns):**
  corner-cut panels, top-left location cluster, top-right status cluster (fps/draws chip,
  volume chip with level bars, settings gear), center dot-and-bracket crosshair when
  pointer-locked, key-chip interaction prompt, angular hotbar with SVG item glyphs,
  toast strip. Debug coords move behind the fps chip.
- **Trees fall:** each tree is an individual mesh (3 shared variant geometries). E near a
  tree swings the axe; every completed swing = shake + +1 wood (preserves the existing
  chop E2E contract); after 3 hits the tree tips away from the player with an accelerating
  rotation and a landing bounce, drops 2 bonus wood pickups, then lies as a fallen trunk
  (its collider is disabled) for 40 s before scaling back up over 2.5 s. Prompt shows hit
  count. All randomization through the seeded PRNG.
- **Glass you can see:** shared `MeshPhysicalMaterial` (transparent, clearcoat,
  sky-matched PMREM environment built once from a tiny procedural gradient scene) with
  warm interior emissive tint and real mullion frames on both house and mansion. No more
  flat `meshBasicMaterial` stickers.
- **Mansion depth (merged buckets, ~5 extra draw calls):** entrance portico (columns,
  pediment, platform steps) with a balustraded balcony above, corner quoins, string
  course + roof cornice, two chimneys with caps, window pediments/sills on every opening,
  and a subtle procedural noise normal map on plaster/roof walls (shared 128² DataTexture,
  toon-safe) for surface relief. House gets the same glass/normal treatment plus door
  trim.

## Impact

- Spec deltas: `audio-system` (new), `hud-and-menus` (new), `tree-chopping` (new),
  `mansion-detail` (new).
- Code: new `lib/settings.ts`, `lib/audio.ts`, `lib/trees.ts`, `scene/textures.ts`,
  `ui/Hud.tsx`, `ui/Menu.tsx`; edits to `App.tsx`, `index.css`, `lib/world.ts`,
  `scene/{Trees,Player,House,Mansion,Effects,Lights,World}.tsx`.
- Validation: existing E2E suite must stay green (chop contract: one E press still yields
  ≥1 wood within 2 s; pickups count 23 before any fall; perf budgets unchanged), plus
  `tsc --noEmit` and `ast-grep` scans (no `Math.random()` — audio uses the seeded PRNG).
