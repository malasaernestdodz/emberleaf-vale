# Design — Screen-fixed slime vitality bar and the right-click slash

## Fantasy framing

The slime's vitality moves out of the world and into the adventurer's
bestiary chrome: a slim strip pinned to the top of the "page" (the viewport),
always legible, always red — the color of a wounded creature — no matter
where the little blob hops. The player's right hand learns a new move: the
quick slash, a flick of the blade (0.22 s) distinct from the heavy committed
swing (0.9 s).

## Bar decisions

| Aspect    | Choice                                                                 |
| --------- | ---------------------------------------------------------------------- |
| Placement | `position: fixed`, top-center (`top: 14px`), above `.toast` (58px)     |
| Geometry  | 220 × 14 px track, 10 px fill, gold `#d8b56a` frame on `#241a10` bark  |
| Fill      | `#e0483e` red, left-anchored, width `frac * 100%`, `transition: width 120ms` |
| Label     | `SLIME` (gold letter-spaced) + `hp/maxHp` count derived from `frac`    |
| Visibility| Rendered unconditionally (outside `hudHidden`); menu card overlays it  |
| Testids   | `slime-health` (bar), `slime-health-fill` (fill), `slime-hp` (count)   |

State source: `slimeHud` (`shown`, `frac`) from `src/lib/slime.ts`, already
mirrored in the snapshot. When `shown` is false (slime hidden/respawning) the
bar shows 0% and `0/3` — still on screen ("always be seen"). The count is
`Math.round(frac * SLIME_MAX_HP)` so the 150 ms HUD poll never desyncs from
the bar.

## Combat decisions

- **Input (`src/lib/input.ts`):** `mousedown` with `e.button === 2` sets
  `clickEdges`/`clickRecent` for button 2 immediately (instant feel; no
  click-distance check needed for a strike), subject to the same
  `.clickable-ui` guard as button 0. `contextmenu` is `preventDefault()`ed on
  `window` so the native menu never appears mid-fight.
- **Slash (`src/scene/Player.tsx`):** `SLASH_TIME = 0.22`,
  `HEAVY_TIME = 0.9`. Right-click edge → swing sfx, `applySlimeHit` now, and
  `attackUntil = game.time + SLASH_TIME` even if a previous slash is still
  playing (restart, no lockout). Left-click path unchanged: heavy swing with
  its existing `attackUntil <= game.time` gate. A shared `attackDur` ref
  feeds `game.attackDur` (the current or most recent swing's duration — kept
  after the swing ends so state-based e2e can read it without racing frame
  stalls) so `game.attack` progress and the snapshot share one duration
  source.
- **Blocked-state edge hygiene:** click edges (buttons 0 and 2) live in a
  short 150 ms window (`CLICK_EDGE_BUFFER_MS` in `src/lib/input.ts`), far
  shorter than the 5 s key-edge buffer, and blocked states additionally
  consume-and-discard them every frame. The expiry is the real guarantee:
  when a SwiftShader boot freezes the rAF loop entirely, discards cannot run
  either, so an unexpired 5 s edge would fire the instant frames resume —
  the 150 ms window makes stale clicks die on their own. Key edges keep the
  5 s buffer (movement re-sends keys continuously; a single click does not).
- **Hit rules untouched:** 1.45 m range, facing dot > 0.5, air/windup
  handling, pop → gel → quest → 20 s respawn (`src/lib/slime.ts`). Fast
  slashes simply re-run the same check per click.

## Render/perf decisions

- The billboard group, its four transparent `depthTest: false` planes, and
  the per-frame fill/ghost easing math are deleted from `Slime.tsx` — fewer
  transparent draws and less frame work.
- The HUD bar is updated only in the existing 150 ms `setInterval` poll (no
  new timers, no per-frame allocations); `transition: width` smooths between
  polls.
- No new rng, no new audio, no collider changes, no `groundHeight` changes.

## Alternatives

- Keep the billboard and add the HUD bar — rejected: two bars for one
  creature, and the moving one is exactly what the user flagged.
- Project the HUD bar from the slime's screen position — rejected: that
  moves with the slime by definition.
- Right-click with a lockout like the heavy swing — rejected: the user
  explicitly rejected "waiting for it to go down"; slash restarts per click.
- `mouseup`-based right-click edge — rejected: `mousedown` reads as more
  instant and cannot be lost to a drag.
