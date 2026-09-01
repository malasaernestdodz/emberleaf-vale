# Design — The fast combo slash and its arc

## Fantasy framing

One sword, one speed: the blade flicks out instantly on any click, sweeps a
horizontal crescent of cyan light across the target, and chains — right,
then left, then right — as long as the player keeps pressing. The world
reacts (squish, knockback, gel), the screen reacts (additive arc caught by
bloom, impact ring on the hit). This is the Devil May Cry/Bayonetta trail
idiom simplified to the indie arc-fan idiom, matching the reference sheet's
cyan energy arcs.

## State machine (`src/lib/slash.ts`, plain module like `slime.ts`)

```
slash = { stage: 0|1, dir: 1|-1, active: bool, t: number, since: number }
start() -> active=true, t=0, stage^=1, dir=stage? -1:1, since=0
tick(dt) -> t+=dt; since+=dt; active = t < SLASH_TIME; if since > COMBO_WINDOW stage=0
reset()  -> active=false, stage=0
```

- `SLASH_TIME = 0.25`, `FADE_TIME = 0.12` (arc fades after the swing),
  `COMBO_WINDOW = 1.1`.
- Stage 0 sweeps dir=+1 (right→left), stage 1 dir=−1; `since` tracks the
  chain window; blocked states call `reset()`.
- Hit check runs in `Player.tsx` per click edge, before `start()`, so a
  whiff still animates (Q6) and a hit lands on the same frame the arc
  spawns.

## VFX anatomy (`src/scene/SlashFx.tsx`)

| Element      | Spec                                                                 |
| ------------ | -------------------------------------------------------------------- |
| Arc fan      | annulus sector r 0.45→1.25, 150° span, 14 segments, XZ plane at chest 0.82 |
| Vertex alpha | leading edge `#9ff3ff` α0.95 → body `#2fa8ff` α0.75 → tail α0 (feathered like the reference) |
| Wisps        | thinner counter-rotated fan (r 0.6→1.1, 120°, α×0.5) per stage       |
| Blending     | `AdditiveBlending`, `depthWrite: false`, `DoubleSide`, `renderOrder 40` |
| Follow       | position = player x/z at chest height, yaw = heading + stage offset; `dir` mirrors the fan |
| Hit ring     | flat annulus 0.35→0.75 m at the slime, 0.18 s life, white-cyan, additive |
| Pool         | 2 arcs + 2 wisps + 1 ring, built once at mount, parked invisible     |

Bloom (`threshold 0.72`) already catches `#9ff3ff`-class pixels — the arc
reads as energy with no new post passes (Q4/Q9).

## Animation (`Player.tsx`)

- Swing progress `p = t / SLASH_TIME`, eased `e = p*p*(3-2p)`.
- `armR.rotation.y = dir * lerp(1.9, -1.6, e)`,
  `armR.rotation.x = -0.35`, `armR.rotation.z = dir * 0.5 * sin(p·π)`.
- `body.rotation.y = dir * 0.45 * sin(p·π)` (counter-twist).
- Playable grounded or airborne; walk cycle otherwise untouched.

## Perf (Q9)

- Worst case +5 draw calls during a swing; geometry/colors are mount-time
  constants; zero per-frame allocations (module-scope scratch reused).
- e2e budget: during a 10-click burst, `drawCalls` may rise ≤ 8 over the
  measured idle baseline and the `fps` gauge stays > 2 (snapshot polls
  only).

## Alternatives (Q4)

- Flipbook sprite sheets (the most common mobile idiom) — rejected:
  needs downloaded textures, banned by the zero-asset rule.
- Full trail ribbon from blade-tip history — rejected for now: needs a
  growing buffer and careful reset semantics; the arc fan delivers the
  same read at a fraction of the complexity (a trail can supersede this
  in a later change).
- New post pass (radial blur / speed lines on attack) — rejected: bloom
  already exists; a second composer pass costs more than it returns at
  this fidelity.
- GPU particles — rejected: no particle system in the stack; the fan +
  ring covers the reference look deterministically.

## Supersessions

- The 0.9 s heavy swing and its two-button split (previous change) are
  removed; `attackDur` reports 0.25 for both buttons. The prior
  instant-hit/rapid-slash/UI-guard scenarios remain true under the new
  delta.
