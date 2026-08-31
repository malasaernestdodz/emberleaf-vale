# Change: Slime vitality HUD bar + right-click fast slash

- **Date:** 2026-08-31
- **Type:** Feature + bug fix (reconciles two open 2026-08-31 rows in
  `openspec/defects.md`)

## Why

User report (2026-08-31): (1) the slime's health must always be seen in front
of the screen — 2D flat, red, and not moving when the slime moves — but the
vitality bar is a world-space billboard parented to the slime
(`src/scene/Slime.tsx`), so it drifts around the frame with every hop;
(2) right-click should attack instantly with a quick slash-slash-slash
animation instead of waiting out the heavy 0.9 s swing — and no right-click
attack exists at all.

## What Changes

- **Screen-fixed slime vitality bar (`App.tsx`, `index.css`):** a DOM bar
  pinned top-center of the viewport — flat 2D, gold parchment frame on dark
  bark, red fill (`#e0483e`), `SLIME` label + `hp/maxHp` count, fill width =
  `slimeHud.frac`. Rendered outside the `hudHidden` gate so it is always
  visible (0% while the slime respawns); the menu card alone overlays it.
- **Billboard bar removed (`Slime.tsx`):** the world-space bar group goes
  away; the HUD bar is the one canonical slime vitality display (MODIFIED
  `health-hud` requirement).
- **Right-click instant fast slash (`input.ts`, `Player.tsx`):** button 2
  registers on `mousedown` (`.clickable-ui` guarded), `contextmenu` is
  prevented globally, and each right-click applies the slime hit immediately
  and plays a 0.22 s slash — pressing again mid-slash restarts instantly, so
  rapid clicks read slash-slash-slash. Left-click keeps the 0.9 s heavy
  swing unchanged.
- **Stale-edge fixes:** click edges live in a short 150 ms window so clicks
  made during blocked states (menu/book/fishing/sit/faint/chop) expire on
  their own — even if the frame loop stalls so long that no discard can run
  — and blocked states additionally consume-and-discard them every frame.
- **Observability (`world.ts`, `Probe.tsx`):** `game.attackDur` reports the
  duration of the current or most recent swing; snapshot exposes it for
  state-based e2e.

## Impact

- Spec deltas: `health-hud` (MODIFIED "Slime vitality bar" → screen-fixed
  HUD bar), `combat-health` (ADDED "Right-click instant fast slash").
- Code: `src/App.tsx`, `src/index.css`, `src/scene/Slime.tsx`,
  `src/scene/Player.tsx`, `src/lib/input.ts`, `src/lib/world.ts`,
  `src/scene/Probe.tsx`.
- Tests: new `e2e/combat.spec.ts`; existing `e2e/health.spec.ts` stays green
  (it polls `slimeHud` state, not the billboard).
- Validation: `npm run spec:validate`, `openspec validate --all --strict`,
  `npm run build`, `npm run lint:sg`, full Playwright suite green.
