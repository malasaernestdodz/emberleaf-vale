# Emberleaf Vale — Project Context

## Overview

A standalone, high-performance Ghibli-style 3D walking scene built with React + Vite.
The player is a chibi character who explores an autumn valley: sand paths, a stone
fountain plaza, a windmill on a hill, a well, a pond, autumn trees, ~70k blades of
GPU-instanced grass, and a house with a walkable interior.

## Stack (verified latest, Aug 2026)

| Layer      | Choice                                   | Version    |
| ---------- | ---------------------------------------- | ---------- |
| Build      | Vite (react plugin)                      | ^8.2       |
| UI         | React                                    | ^19.2      |
| 3D         | three.js                                 | ^0.185.1   |
| React 3D   | @react-three/fiber                       | ^9.7.0     |
| Post FX    | @react-three/postprocessing + postprocessing | ^3.1.1 / ^6.39.4 |
| Language   | TypeScript (strict)                      | ~6.0       |
| E2E        | @playwright/test (chromium, SwiftShader WebGL) | ^1.62 |

## Conventions

- TypeScript strict mode, no `any` in app code.
- No code comments; code is self-describing (small files, clear names).
- All randomness goes through a seeded PRNG (`mulberry32`, fixed seed) so the world
  layout is deterministic between runs and between app/tests.
- Zero per-frame allocations in the render loop (module-scope scratch vectors).
- All time-based smoothing is framerate-independent (`1 - exp(-k*dt)` damping).
- Test hooks live behind one global: `window.__Ghibli` (see `e2e-verification` spec).
- Windows shell: `npm.ps1` is blocked by execution policy — always use `npm.cmd`.
- Prop dimensions live in `src/lib/world.ts`, never hard-coded in scenes; doors
  are built through `src/scene/door.ts`. New props ship with math invariants in
  `e2e/props.spec.ts` plus a gallery camera pose in `e2e/gallery.spec.ts`
  (see `prop-models`, `world-fit`, and `visual-verification` specs).
- Audio is procedural WebAudio (`src/lib/audio.ts`) with settings persisted via
  `src/lib/settings.ts`; never ship audio files or call `Math.random()` for
  audio scheduling (use the seeded rng).
- Gameplay state machines (slime, trees, quests, health) live in `src/lib/` as
  plain exported objects updated from `useFrame`; scene components only render
  them, and e2e reads them through the `window.__Ghibli` snapshot.
- e2e assertions are state-based (snapshot polling loops) because SwiftShader
  frame stalls of 500ms+ are normal; `playwright.kilo.config.ts` runs the suite
  on a private port (:4322) when :4173 is contended.

## Commands

| Command            | Purpose                          |
| ------------------ | -------------------------------- |
| `npm run dev`      | Dev server (port 5173)           |
| `npm run build`    | `tsc --noEmit && vite build`     |
| `npm run preview`  | Serve dist on port 4173          |
| `npm run test:e2e` | Playwright suite (manages server)|

## Non-goals

- No physics engine (Rapier/cannon) — kinematic controller is lighter and deterministic.
- No WebGPU-only path in v1 — WebGL2 + instancing; renderer swap to WebGPU/TSL is
  deferred (see design.md "Alternatives").
- No multiplayer, no downloaded assets (models, textures, audio) — everything
  procedural. Audio is in-scope as of 2026-08-30 (`sound-system`,
  `audio-system` specs).
