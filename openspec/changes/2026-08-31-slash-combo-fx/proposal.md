# Change: One fast combo slash + procedural slash-arc VFX

- **Date:** 2026-08-31
- **Type:** Feature + refactor (reconciles the two new open rows in
  `openspec/defects.md`; supersedes the two-button attack split of
  2026-08-31-slime-hud-and-right-click-slash)

## Why

User report (2026-08-31, with reference anime slash-arc art): "remove my
current drift — why do I need right-click to see the attack speed"; the
attack should be a horizontal, combo-based chain "like Zelda handles it";
and it needs a real slash effect "like AAA companies or indies handle it in
3D — post-processing or effect when you attack", validated with fps and
visual testing.

## What Changes

- **One fast attack on both buttons (`scene/Player.tsx`,
  `scene/CameraRig` untouched):** the 0.9 s heavy swing is deleted; left
  and right click both fire the instant fast slash (`SLASH_TIME = 0.25`),
  hit check per press, no lockout between presses.
- **Zelda-style two-stage combo (`lib/slash.ts` new):** consecutive presses
  within a 1.1 s window alternate swing direction (right→left, then
  left→right); a later press resets to stage 0. Blocked states reset the
  chain and discard click edges (behavior from the previous change kept).
- **Horizontal slash animation:** sword arm sweeps across the body
  (`rotation.y` eased by combo direction) with a body counter-twist, both
  airborne and grounded; legs keep the walk cycle.
- **Procedural slash-arc VFX (`scene/SlashFx.tsx` new):** per-stage annulus
  sector fans (150° span, feathered vertex-alpha edges, cyan core
  `#9ff3ff` → `#2fa8ff`) with additive blending + counter-wisp fans, plus a
  pooled hit-ring flash at the impact point. Picked up by the existing
  bloom pass. Zero textures, zero `Math.random()` — constants and vertex
  colors only. Pooled (4 meshes + 1 ring), no per-frame allocations.
- **Observability (`world.ts`, `Probe.tsx`):** snapshot gains
  `slash: { stage, dir, active }`; VFX meshes get stable names
  (`slash-arc-0/1`, `slash-wisp-0/1`, `slash-hit-ring`) for
  `objectVisible`.

## Impact

- Spec deltas: `combat-health` (MODIFIED: one fast combo slash on both
  buttons; REMOVED: the committed heavy swing), new `slash-fx` capability
  spec (ADDED: procedural slash VFX contract).
- Code: `src/scene/Player.tsx`, `src/lib/slash.ts` (new),
  `src/scene/SlashFx.tsx` (new), `src/lib/world.ts`, `src/scene/Probe.tsx`,
  `src/scene/World.tsx`.
- Tests: `e2e/combat.spec.ts` updated (both-button fast slash, combo
  alternation/reset, UI guards kept); new VFX state/pixel assertions and a
  perf slash-burst budget; mid-slash screenshots under
  `test-results/slash-fx/`.
- Known-failing baseline: exactly the 6 windmill rows recorded in
  `openspec/defects.md` (peer windmill geometry change) may fail; zero new
  failures elsewhere.
- Validation: `npm run spec:validate`, `openspec validate --all --strict`,
  `npm run build`, `npm run lint:sg`, Playwright suite.
