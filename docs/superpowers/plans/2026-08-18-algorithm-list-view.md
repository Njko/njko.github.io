# Algorithm List View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a toggle button on the wheel screen that switches to a scrollable list of all 17 algorithms, so anyone who wants to browse what's available doesn't have to spin the wheel.

**Architecture:** The page gains a second top-level view (`#list-view`, hidden by default) alongside the existing wheel (`#wheel-view`, wrapping the current canvas + spin button). A single toggle button swaps `hidden` on the two containers and flips its own label. The list is a plain `<ul>` of buttons built from the already-loaded `algorithms` array — each row shows a color swatch (reusing the wheel's `PALETTE`), the algorithm name, and its `summary`. Clicking a row calls the existing `showResult(algorithm)` function, so the exact same result panel used after a spin opens — no new panel, no new data flow. No changes to `algorithms.json`.

**Tech Stack:** Same as the rest of the repo — vanilla HTML/CSS/JS, no build step, no dependencies.

**Spec:** No separate spec doc — this plan was authored directly from the feature request (per user instruction, skipping the brainstorming/spec step). The full request: "un écran qui permet de voir les algorithmes sous forme d'une liste plutôt que la roue... Ajoute un bouton sur l'écran de la roue pour toggle ce nouvel affichage."

## Global Constraints

- Zero dependency: no npm packages, no CDN scripts, no build step.
- Content language: French for all UI copy (button labels, etc.), matching the rest of the app.
- Reuse `showResult(algorithm)` / `hideResultPanel()` unchanged — the list view must not introduce a second result panel or duplicate that markup.
- Reuse the existing `PALETTE` array for the list's color swatches, so swatch colors visually match the wheel's sector colors at the same index.
- No test framework exists in this repo; verification is via `node --check` (syntax) and manual browser checks against a local `python -m http.server` instance, consistent with the rest of the project.
- Casino visual style (dark background, gold accent, rounded cards) must carry over to the new list rows and toggle button — no unstyled/default HTML elements.

---

## Task 1: Two-view HTML layout and list/toggle styling

**Files:**
- Modify: `index.html`
- Modify: `style.css`

**Interfaces:**
- Produces DOM ids relied on by Task 2: `wheel-view` (wraps the existing wheel canvas + spin button), `list-view` (new, initially `hidden`), `algo-list` (the empty `<ul>` inside `list-view` that Task 2 populates), `toggle-view-btn` (the new toggle button).
- `load-error` keeps its existing id but moves to be a page-level element (sibling of both views, not nested inside `wheel-view`), since a data-load failure makes both views non-functional.

- [ ] **Step 1: Restructure `index.html` into two views**

Replace the `<main class="page">` block (currently lines 10-20) with:

```html
  <main class="page">
    <h1>🎡 La roue des algos</h1>

    <div id="wheel-view" class="wheel-view">
      <div id="wheel-wrap" class="wheel-wrap">
        <canvas id="wheel-canvas"></canvas>
        <div class="pointer" aria-hidden="true"></div>
      </div>
      <button id="spin-btn" type="button">Lancer la roue</button>
    </div>

    <div id="list-view" class="list-view" hidden>
      <ul id="algo-list" class="algo-list"></ul>
    </div>

    <button id="toggle-view-btn" type="button">📋 Voir la liste</button>
    <p id="load-error" class="load-error" hidden>Impossible de charger la liste des algorithmes. Réessayez plus tard.</p>
  </main>
```

The rest of `index.html` (the `#result-panel` block and the `<script src="wheel.js">` tag) is unchanged.

- [ ] **Step 2: Add list view and toggle button styles to `style.css`**

Append to the end of `style.css` (after the existing `@media (max-width: 600px)` block):

```css
.wheel-view {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.list-view {
  width: min(90vw, 700px);
  margin: 1rem 0;
}

.list-view[hidden] {
  display: none;
}

.algo-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.algo-list-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.9rem;
  background: var(--bg-alt);
  border: none;
  border-radius: 14px;
  padding: 0.85rem 1.2rem;
  text-align: left;
  cursor: pointer;
  color: var(--text);
  transition: background 0.15s ease, transform 0.15s ease;
}

.algo-list-item:hover {
  background: #331a5c;
  transform: translateY(-1px);
}

.algo-list-swatch {
  flex: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
}

.algo-list-name {
  flex: none;
  font-weight: 700;
  font-size: clamp(1rem, 1.8vw, 1.2rem);
}

.algo-list-summary {
  opacity: 0.75;
  font-size: clamp(0.85rem, 1.5vw, 1rem);
}

#toggle-view-btn {
  font-size: 1rem;
  font-weight: 700;
  padding: 0.6rem 1.5rem;
  border: 2px solid var(--accent);
  border-radius: 999px;
  background: transparent;
  color: var(--accent);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

#toggle-view-btn:hover:not(:disabled) {
  background: var(--accent);
  color: #241247;
}

#toggle-view-btn:disabled {
  border-color: #5a5470;
  color: #9a93ac;
  cursor: not-allowed;
}
```

- [ ] **Step 3: Manually verify the static layout**

Run: `python -m http.server 8000` in the repo root, open `http://localhost:8000/` in a browser, and confirm:
- The wheel still renders exactly as before (17 colored sectors, pointer, gold "Lancer la roue" button).
- Below it, a new outlined "📋 Voir la liste" button is visible.
- No visible `#list-view` content (it's `hidden`).
- No console errors.

Stop the server (Ctrl+C) when done.

- [ ] **Step 4: Commit**

```bash
git add index.html style.css
git commit -m "Add two-view layout scaffold (wheel-view/list-view) and list/toggle styling"
```

---

## Task 2: Wire up the list view and toggle behavior

**Files:**
- Modify: `wheel.js`

**Interfaces:**
- Consumes: `PALETTE`, `algorithms` (array, populated by `loadAlgorithms()`), `showResult(algorithm)`, `showLoadError()`, `resizeCanvas()`, `drawWheel(rotation)`, `currentRotation` — all from the existing file.
- Consumes DOM ids from Task 1: `wheel-view`, `list-view`, `algo-list`, `toggle-view-btn`.
- Produces: `renderAlgorithmList()`, `showListView()`, `showWheelView()`, `handleToggleViewClick()`, and a new module-level state variable `currentView` (`'wheel'` | `'list'`).

- [ ] **Step 1: Add the new DOM references**

In the existing block of `const ... = document.getElementById(...)` declarations near the top of `wheel.js`, add these four lines right after the `relaunchButton` declaration:

```javascript
const wheelView = document.getElementById('wheel-view');
const listView = document.getElementById('list-view');
const algoList = document.getElementById('algo-list');
const toggleViewButton = document.getElementById('toggle-view-btn');
```

- [ ] **Step 2: Add the `currentView` state variable**

In the existing `let algorithms = []; let currentRotation = 0; let isSpinning = false;` block, add a fourth line:

```javascript
let currentView = 'wheel';
```

- [ ] **Step 3: Add `renderAlgorithmList`, `showListView`, `showWheelView`, and `handleToggleViewClick`**

Insert these functions directly after `hideResultPanel` (before `showLoadError`):

```javascript
function renderAlgorithmList() {
  algoList.replaceChildren(
    ...algorithms.map((algo, i) => {
      const item = document.createElement('li');

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'algo-list-item';
      button.addEventListener('click', () => showResult(algo));

      const swatch = document.createElement('span');
      swatch.className = 'algo-list-swatch';
      swatch.style.backgroundColor = PALETTE[i % PALETTE.length];

      const name = document.createElement('span');
      name.className = 'algo-list-name';
      name.textContent = algo.name;

      const summary = document.createElement('span');
      summary.className = 'algo-list-summary';
      summary.textContent = algo.summary;

      button.append(swatch, name, summary);
      item.appendChild(button);
      return item;
    })
  );
}

function showListView() {
  currentView = 'list';
  wheelView.hidden = true;
  listView.hidden = false;
  toggleViewButton.textContent = '🎡 Voir la roue';
}

function showWheelView() {
  currentView = 'wheel';
  listView.hidden = true;
  wheelView.hidden = false;
  toggleViewButton.textContent = '📋 Voir la liste';
  resizeCanvas();
  drawWheel(currentRotation);
}

function handleToggleViewClick() {
  if (currentView === 'wheel') {
    showListView();
  } else {
    showWheelView();
  }
}
```

`showWheelView` re-runs `resizeCanvas()` + `drawWheel()` because the canvas's wrapper has `clientWidth: 0` while `wheel-view` is `hidden` — if a window resize happened while the list was showing, the canvas would otherwise stay sized for the stale dimensions.

- [ ] **Step 4: Make `showLoadError` also disable the toggle button**

Replace:

```javascript
function showLoadError() {
  loadError.hidden = false;
  spinButton.disabled = true;
}
```

with:

```javascript
function showLoadError() {
  loadError.hidden = false;
  spinButton.disabled = true;
  toggleViewButton.disabled = true;
}
```

- [ ] **Step 5: Wire everything up in `init()`**

Replace the body of `init()`:

```javascript
async function init() {
  try {
    algorithms = await loadAlgorithms();
  } catch (err) {
    showLoadError();
    return;
  }
  resizeCanvas();
  drawWheel(currentRotation);
  window.addEventListener('resize', () => {
    resizeCanvas();
    drawWheel(currentRotation);
  });
  spinButton.addEventListener('click', handleSpinClick);
  relaunchButton.addEventListener('click', hideResultPanel);
}
```

with:

```javascript
async function init() {
  try {
    algorithms = await loadAlgorithms();
  } catch (err) {
    showLoadError();
    return;
  }
  resizeCanvas();
  drawWheel(currentRotation);
  renderAlgorithmList();
  window.addEventListener('resize', () => {
    resizeCanvas();
    drawWheel(currentRotation);
  });
  spinButton.addEventListener('click', handleSpinClick);
  relaunchButton.addEventListener('click', hideResultPanel);
  toggleViewButton.addEventListener('click', handleToggleViewClick);
}
```

- [ ] **Step 6: Syntax-check the JS**

Run: `node --check wheel.js`
Expected: no output (exit code 0).

- [ ] **Step 7: Manually verify the toggle and list**

Run: `python -m http.server 8000`, open `http://localhost:8000/`, open the browser console, then:
- Click "📋 Voir la liste". Confirm the wheel disappears, a scrollable list of 17 rows appears (each with a colored dot, a bold name, and a dimmer summary line), and the button now reads "🎡 Voir la roue".
- Click one of the list rows (not the first one). Confirm the same result panel used after a spin opens, showing that row's name, description, keyword pills, and iOS/Android cards.
- Click "Relancer" to close the panel. Confirm you're still on the list view (not bounced back to the wheel).
- Click "🎡 Voir la roue". Confirm the list disappears, the wheel reappears correctly sized and centered, and the button reads "📋 Voir la liste" again.
- Click "Lancer la roue" and confirm the wheel still spins normally (regression check — the toggle wiring must not have broken the existing spin flow).
- Confirm no console errors throughout.

Stop the server (Ctrl+C) when done.

- [ ] **Step 8: Commit**

```bash
git add wheel.js
git commit -m "Wire up algorithm list view with a wheel/list toggle button"
```

---

## Task 3: Final QA pass

**Files:** none (verification only — fix forward in `index.html`, `style.css`, or `wheel.js` if an issue is found).

**Interfaces:** none — this task exercises the finished feature end-to-end.

- [ ] **Step 1: Run the full manual checklist**

Run: `python -m http.server 8000`, open `http://localhost:8000/`, and verify all of the following:

1. **Toggle round-trip stability:** switch wheel → list → wheel → list five times in a row. Confirm no layout glitches, no duplicated list rows (list must not grow each time — `renderAlgorithmList()` only runs once at `init()`, so this also confirms the list isn't accidentally re-rendered on every toggle).
2. **List completeness:** count the rows in the list view — must be exactly 17, matching the 17 wheel sectors, in the same order as `algorithms.json`.
3. **Click-through consistency:** from the list, click 3 different rows (first, a middle one, the last one) and confirm each opens the result panel with the matching name/description/keywords/iOS/Android content for that exact row.
4. **Error path still works:** temporarily rename `algorithms.json` to `algorithms.json.bak`, refresh the page. Confirm the error message appears, "Lancer la roue" is disabled, AND "📋 Voir la liste" is also disabled (not just spin). Rename the file back to `algorithms.json` and refresh again to confirm normal operation resumes.
5. **Spin regression:** after all the above, do one full spin from the wheel view and confirm the 3s decelerating animation and result panel still work exactly as before this feature was added.

If any check fails, fix the issue in the relevant file and re-run the specific failing check before proceeding.

- [ ] **Step 2: Final commit (only if Step 1 required fixes)**

If Step 1 required any code fix:
```bash
git add -A
git commit -m "Fix issues found in list view QA pass"
```
If no fixes were needed, skip this step — Task 2's commit is already the final state.
