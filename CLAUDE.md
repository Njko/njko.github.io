# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"La roue des algos" — a spinning-wheel web game listing common data structures and algorithms (originally scoped for iOS), each paired with an iOS (Swift) and Android (Kotlin) implementation angle. Zero-dependency, static, hosted on GitHub Pages.

## Development

No build step, no package manager, no dependencies.

**Local development:**
```bash
python -m http.server 8000
```

**Deployment:** Automatic via GitHub Pages on push to main. No CI/CD pipeline.

**No tests or linting configured.** Verification is manual: `node --check wheel.js` for syntax, `node validate-algorithms.js` for validating `algorithms.json` (checks the `docUrl`/`practiceUrl`/`exercises` schema), and browser checks against a local server.

## Architecture

- **`index.html`** — Page structure: the wheel canvas, spin button, and the result panel markup.
- **`style.css`** — Casino-style visual design, layout, and responsive rules (the iOS/Android result cards stack vertically below 600px).
- **`wheel.js`** — All game logic: fetches `algorithms.json`, draws the wheel on a `<canvas>` (Canvas 2D API), computes the winning rotation, animates the decelerating spin with Wheel-of-Fortune-style peg/pointer physics (`requestAnimationFrame` + `easeOutQuint`), and renders the result panel including the exercise accordion (Swift/Kotlin tabs, solution reveal).
- **`algorithms.json`** — Data store for the 17 algorithms. Each entry: `id`, `name`, `category` (`structure` | `algorithme` | `ios-specifique`, informative only), `summary`, `fullDescription`, `ios`, `android`, `keywords`, `docUrl`, `practiceUrl` (optional), and `exercises` (3 levels — facile/moyen/difficile — each with a `statement` and per-language `swift`/`kotlin` objects containing `signature`, `solution`, and `tests`).

**Data flow:** Page load → fetch `algorithms.json` → draw the static wheel → user clicks "Lancer la roue" → uniform random pick (with replacement) → decelerating rotation animation → result panel shows the winning algorithm's description and iOS/Android detail.

**Spin animation:** fixed at `SPIN_DURATION_MS` = 4500ms, `easeOutQuint` easing for the deceleration. A separate `#wheel-pointer` element simulates a physical peg/pointer: each time the rotating wheel crosses a sector boundary, the pointer deflects (amplitude tied to the wheel's instantaneous speed, tapering off near the end of the spin) then springs back through a decaying cosine "wobble" before settling — see `animateSpin` in `wheel.js` for the exact model (`POINTER_MAX_DEFLECTION_DEG`, `POINTER_DECAY_MS`, `POINTER_OSCILLATION_MS`, `POINTER_TAPER_RATIO`).

## Content Language

The app UI, README, and algorithm descriptions are written in **French**. Technical API/framework names stay in their native English form (e.g. `DispatchWorkItem`, `LruCache`, `DiffUtil`).
