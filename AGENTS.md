# AGENTS.md — Emberleaf Vale

Agent-facing guide for working in this repo. Read `openspec/project.md` for the
project context and `openspec/` for the spec/change workflow.

## What this is

A Ghibli-style 3D walking scene (React 19 + Vite + three.js via
@react-three/fiber), fully procedural (zero downloaded assets), validated by a
Playwright e2e suite. Gameplay: exploration, items/hotbar, chopping, fishing,
sleeping, quests, a slime companion NPC with sword combat, hearts/health,
procedural audio with a settings menu, pause menu, perf governor.

## Commands (Windows shell — `npm.ps1` is blocked, always use `npm.cmd`)

| Command                        | Purpose                                              |
| ------------------------------ | ---------------------------------------------------- |
| `npm.cmd run dev`              | Dev server on :5173                                  |
| `npm.cmd run build`            | `tsc --noEmit` + vite build (must be green)          |
| `npm.cmd run preview`          | Serve `dist/` on :4173 (strict port)                 |
| `npm.cmd run lint:sg`          | ast-grep scans (`rules/*.yml`) — must be green       |
| `npm.cmd run test:e2e`         | Full Playwright suite (manages its own server)       |
| `npx.cmd playwright test --config=playwright.kilo.config.ts` | Suite on a private port (:4322) — use when another agent/process may hold :4173 |

Gates before declaring any change done: `build` + `lint:sg` + full `test:e2e`
green, `openspec validate --all --strict` clean. Changes dated 2026-08-31 or
later also need a `grilling.md` interview record — `npm run spec:validate`
enforces it (min 8 answered questions).

## The validation loop (how work is done here)

0. Grill first: run `/grill-me` on the change — a frontier interview against
   the root context, agent-answered where facts settle it, user-answered for
   real decisions, recorded in the change's `grilling.md` and folded back into
   the proposal/specs (see "Grilling" below). More answered questions is
   better; never stop at the validator minimum when the frontier isn't empty.
1. Spec first: add/extend an `openspec/changes/<date>-<name>/` change
   (grilling → proposal → design → specs → tasks) before touching code.
2. Implement against the specs; keep `e2e` as the contract.
3. Run the gates. Fix everything they surface, then re-run until clean.
4. Check off `tasks.md` items only after the corresponding verification passes.
5. `openspec archive` the change when fully landed.

Never mark a task done from intent — only from a passing gate.

## Grilling (mandatory since 2026-08-31)

Every new change gets a `grilling.md`: at least 8 questions the agent asks and
answers itself, grounded in `openspec/project.md`, `AGENTS.md`, and the
archived specs, sweeping scope fidelity, model/geometry, animation, collision,
HUD, audio, interactions, health, persistence, perf, determinism, and the e2e
contract. Grill toward MORE fidelity to the user's request — when a question
exposes a gap, widen the spec, never quietly cut scope. `npm run
spec:validate` fails changes without a compliant `grilling.md`. User-reported
defects land in `openspec/defects.md` first; `/grill-me` must reconcile every
open row into the change (including a gallery screenshot sweep — see-through
faces, missing surfaces under walkable positions, frames narrower than their
colliders) before the specs are final.

## Hard rules (enforced by ast-grep, see `rules/`)

- No `Math.random()` in `src/**` — use `mulberry32` from `src/lib/math.ts`
  (fixed seeds) so world layout and tests stay deterministic.
- `resolveCollisions(x, z, r, feetY)` must always receive the feet-Y argument.
- TypeScript strict, no `any`, no comments in app code, no per-frame heap
  allocations in `useFrame` bodies.
- All prop dimensions live in `src/lib/world.ts`; doors are built through
  `src/scene/door.ts`; new props ship with `e2e/props.spec.ts` invariants and a
  `e2e/gallery.spec.ts` camera pose.

## Architecture map

- `src/lib/` — pure logic, no React: `world.ts` (layout constants, terrain,
  colliders, `game` singleton), `collide.ts`, `items.ts`, `quests.ts`,
  `slime.ts` (slime state machine), `trees.ts` (chop/fall lifecycle),
  `health.ts`, `audio.ts` (procedural WebAudio + persisted settings),
  `settings.ts` (localStorage-backed quality/volume), `perf.ts`/`trace.ts`
  (governor + observability), `input.ts` (edge-buffered keys; UI clicks marked
  `.clickable-ui` never reach the canvas).
- `src/scene/` — R3F components reading the lib state machines in `useFrame`.
  `Probe.tsx` exposes the single test contract `window.__Ghibli` (snapshot +
  hooks: `teleport`, `setCamYaw`, `face`, `setMenu`, `skipSlimeRespawn`).
- `src/App.tsx` — Canvas + HUD/menu shell; `Hud` polls game state at 150 ms.
- `e2e/` — Playwright specs. Assertions are state-based (poll snapshots), not
  timing-based; SwiftShader runs at 2-60 fps with multi-second hitches, so
  never assert on wall-clock durations.

## Test environment caveats

- Playwright boots Chromium with SwiftShader (`playwright.config.ts`); frame
  stalls of 500ms+ are normal. Prefer snapshot polling loops with generous
  iteration counts over `waitForTimeout`-only waits.
- The e2e server uses strict port 4173. If two agent sessions run suites
  concurrently they will kill each other's server mid-run (symptom: batches of
  `page.goto` `ERR_CONNECTION_REFUSED` failures that pass in isolation). Use
  `playwright.kilo.config.ts` (port 4322) to isolate.
- One agent per working tree. Two agents editing the same tree corrupt each
  other's in-flight edits; split work by openspec change instead.

## OpenSpec layout

- `openspec/project.md` — stack, conventions, commands, non-goals.
- `openspec/changes/<date>-<name>/` — proposal, design, `tasks.md` (checklist),
  `grilling.md` (agent-answered interrogation record), and per-capability
  `specs/<capability>/spec.md` deltas.
- `openspec/specs/` — archived capabilities (source of truth for "what is").
