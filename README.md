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
- `npm run lint:sg` — ast-grep structural rules (determinism, collision arg safety)
- `npm run test:e2e` — Playwright: controls, camera occlusion, collision math,
  house/mansion/windmill interiors, interactions — on SwiftShader WebGL
- `e2e/math.spec.ts` — pure height-field/spiral invariants in Node

Full spec trail in `openspec/`.
