# Emberleaf Vale

A Ghibli-style 3D walking scene — React 19 + Vite + three.js + @react-three/fiber,
validated end to end (browser E2E + pure-math tests + ast-grep structural rules).

[![regression](https://github.com/malasaernestdodz/emberleaf-vale/actions/workflows/ci.yml/badge.svg)](https://github.com/malasaernestdodz/emberleaf-vale/actions/workflows/ci.yml)

## Play

```bash
npm install
npm run dev        # http://localhost:5173
```

Click the world to capture the mouse (Esc frees it).

| Input | Action |
| --- | --- |
| WASD / Arrows | walk |
| Ctrl / Shift / double-W | sprint (FOV kick) |
| Space | jump |
| E | interact (sleep, read, chop, pick up, fish) |
| G | throw selected item |
| 1-4 | select hotbar item |
| Mouse drag / scroll | look / zoom |

Explore: sand paths, fountain plaza (jump on the rim), well you can climb into,
a two-floor mansion with a grand bed, a windmill with an interior spiral staircase,
~70k blades of GPU-instanced grass that bend around you, falling leaves, butterflies.

## Validation

- `npm run build` — TypeScript strict + Vite production build
- `npm run lint:sg` — ast-grep structural rules: determinism, collision arg
  safety, and the camera clamp drift guards (indoor ray clamp, outdoor
  occlusion dolly, guarded position clamps, damped-only interior factor —
  each verified to fire on injected drift)
- `npm run test:camera` — dedicated camera regression: wall-distance math
  invariants + the walk-in / zoom / walk-out house journey with an
  unoccluded-line-of-sight invariant
- `npm run test:e2e` — Playwright: controls, camera occlusion, collision math,
  house/mansion/windmill interiors, interactions — on SwiftShader WebGL
- `e2e/math.spec.ts` — pure height-field/spiral invariants in Node

CI runs OpenSpec (`openspec validate --all --strict`), ast-grep, build, the
camera regression, then the full E2E suite.

Full spec trail in `openspec/`.
