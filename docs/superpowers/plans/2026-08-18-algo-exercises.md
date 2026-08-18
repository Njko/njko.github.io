# Exercices concrets + liens doc/pratique Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 3 progressive exercises (facile/moyen/difficile, with Swift + Kotlin signatures, example tests, and a hideable naive solution) plus a documentation link and an optional practice-site link to every algorithm in "La roue des algos".

**Architecture:** Extend `algorithms.json` with `docUrl`, `practiceUrl` (optional), and `exercises` (array of 3) per algorithm. Render the new content in the existing result panel via new DOM-building functions in `wheel.js` (no `innerHTML`, matching existing code style) and new CSS in `style.css`, using a native `<details>` accordion (one per exercise) with a Swift/Kotlin tab toggle and a reveal-solution button, both handled by a single delegated click listener. No new dependencies, no build step.

**Tech Stack:** Vanilla JS (ES2017+, `const`/`arrow functions`/`Array#flatMap`-free), vanilla CSS, static JSON, Python's `http.server` for local dev — unchanged from the existing project.

**Spec:** `docs/superpowers/specs/2026-08-18-algo-exercises-design.md`

## Global Constraints

- Zero dependencies, zero build step — every file is served as-is (from `CLAUDE.md`).
- All UI copy is in French; technical API/framework names stay in their native English form (from `CLAUDE.md`).
- DOM content built via `document.createElement` + `textContent` only — never `innerHTML` — matching the existing pattern in `wheel.js` (from the spec's UI section).
- `exercises` is always exactly 3 items, in order `facile`, `moyen`, `difficile`; `tests` is always exactly 2 items; `practiceUrl` is omitted (not `null`) when no relevant site exists (from the spec's Data schema section).
- Solutions may be algorithmically non-optimized; difficulty progression comes from the scope of what each level's statement asks for (from the spec's Data schema section).
- Every `docUrl`/`practiceUrl` must be verified (WebFetch, or WebSearch if WebFetch is blocked, e.g. LeetCode returns 403 to WebFetch) before being committed (from the spec's Doc/practice link research section).

---

### Task 1: Data validation script

**Files:**
- Create: `validate-algorithms.js`
- Modify: `CLAUDE.md` (Development section, verification bullet)

**Interfaces:**
- Produces: a CLI script runnable as `node validate-algorithms.js` from the repo root, exit code `0` and stdout `OK: <n> algorithms validated.` when every algorithm in `algorithms.json` satisfies the schema below; exit code `1` and one `stderr` line per violation, prefixed `<n> validation error(s):`, otherwise. Every later content task runs this script as its last verification step.
- Consumes: `algorithms.json` at the repo root (existing file, read-only).

Schema enforced (per algorithm object): `docUrl` non-empty string; `practiceUrl`, if the key is present, non-empty string; `exercises` array of exactly 3 items with `level` equal to `"facile"`, `"moyen"`, `"difficile"` in that order; each exercise has non-empty string `title` and `statement`; `swift` and `kotlin` objects each with non-empty string `signature` and `solution`; `tests` array of exactly 2 items, each with non-empty string `input` and `output`.

- [ ] **Step 1: Write the validation script**

```javascript
'use strict';

const fs = require('fs');
const path = require('path');

const REQUIRED_LEVELS = ['facile', 'moyen', 'difficile'];

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateExercise(prefix, exercise, index) {
  const errors = [];
  const expectedLevel = REQUIRED_LEVELS[index];
  if (exercise.level !== expectedLevel) {
    errors.push(`${prefix} exercises[${index}].level must be "${expectedLevel}", got "${exercise.level}"`);
  }
  ['title', 'statement'].forEach((field) => {
    if (!isNonEmptyString(exercise[field])) {
      errors.push(`${prefix} exercises[${index}].${field} must be a non-empty string`);
    }
  });
  ['swift', 'kotlin'].forEach((lang) => {
    const block = exercise[lang];
    if (!block || !isNonEmptyString(block.signature) || !isNonEmptyString(block.solution)) {
      errors.push(`${prefix} exercises[${index}].${lang} must have non-empty signature and solution`);
    }
  });
  if (!Array.isArray(exercise.tests) || exercise.tests.length !== 2) {
    errors.push(`${prefix} exercises[${index}].tests must be an array of exactly 2 items`);
  } else {
    exercise.tests.forEach((test, testIndex) => {
      if (!isNonEmptyString(test.input) || !isNonEmptyString(test.output)) {
        errors.push(`${prefix} exercises[${index}].tests[${testIndex}] must have non-empty input and output strings`);
      }
    });
  }
  return errors;
}

function validateAlgorithm(algo) {
  const prefix = `[${algo.id}]`;
  const errors = [];
  if (!isNonEmptyString(algo.docUrl)) {
    errors.push(`${prefix} docUrl must be a non-empty string`);
  }
  if (Object.prototype.hasOwnProperty.call(algo, 'practiceUrl') && !isNonEmptyString(algo.practiceUrl)) {
    errors.push(`${prefix} practiceUrl, if present, must be a non-empty string`);
  }
  if (!Array.isArray(algo.exercises) || algo.exercises.length !== 3) {
    errors.push(`${prefix} exercises must be an array of exactly 3 items`);
    return errors;
  }
  algo.exercises.forEach((exercise, index) => {
    errors.push(...validateExercise(prefix, exercise, index));
  });
  return errors;
}

function main() {
  const filePath = path.join(__dirname, 'algorithms.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const algorithms = data.algorithms;
  const errors = algorithms.flatMap(validateAlgorithm);

  if (errors.length > 0) {
    console.error(`${errors.length} validation error(s):`);
    errors.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
  }
  console.log(`OK: ${algorithms.length} algorithms validated.`);
}

main();
```

- [ ] **Step 2: Run it against the current (unmodified) `algorithms.json` and confirm it fails with one `docUrl`/`exercises` error pair per algorithm**

Run: `node validate-algorithms.js`
Expected: exit code `1`, stderr starts with `34 validation error(s):` (17 algos × 2 errors each: missing `docUrl` and missing `exercises`), listing every algorithm id from `queue-fifo` through `flatten-tree`.

- [ ] **Step 3: Update `CLAUDE.md`'s verification bullet to reference the new script**

In `CLAUDE.md`, under `## Development`, replace:

```
**No tests or linting configured.** Verification is manual: `node --check wheel.js` for syntax, `node -e` scripts for validating `algorithms.json`, and browser checks against a local server.
```

with:

```
**No tests or linting configured.** Verification is manual: `node --check wheel.js` for syntax, `node validate-algorithms.js` for validating `algorithms.json` (checks the `docUrl`/`practiceUrl`/`exercises` schema), and browser checks against a local server.
```

- [ ] **Step 4: Commit**

```bash
git add validate-algorithms.js CLAUDE.md
git commit -m "Add algorithms.json schema validation script"
```

---

### Task 2: LRU Cache exercise content (pipeline smoke test)

**Files:**
- Modify: `algorithms.json` (the `lru-cache` object, currently `algorithms.json:14-22`)

**Interfaces:**
- Consumes: `validate-algorithms.js` from Task 1.
- Produces: a fully populated `lru-cache` entry matching the schema, used as the reference/template by every later content task (Tasks 5-20) for structure and quality bar.

- [ ] **Step 1: Verify the two links resolve**

`docUrl` (`https://en.wikipedia.org/wiki/Cache_replacement_policies`) was confirmed during design: the page has a dedicated "Simple recency-based policies" section covering LRU. `practiceUrl` (`https://leetcode.com/problems/lru-cache/`) was confirmed via web search during design: it is LeetCode problem 146, "LRU Cache" (Medium), asking for `get`/`put` with O(1) average time — matches this algorithm exactly. Both are safe to use as-is; no further action needed for this step.

- [ ] **Step 2: Replace the `lru-cache` object in `algorithms.json`**

Replace the existing object (keys `id` through `keywords`) with this complete object — every existing field is preserved verbatim, three new fields (`docUrl`, `practiceUrl`, `exercises`) are added:

```json
    {
      "id": "lru-cache",
      "name": "LRU Cache",
      "category": "structure",
      "summary": "Dictionnaire + liste doublement chaînée",
      "fullDescription": "Cache à éviction LRU (Least Recently Used) : une hash map donne l'accès O(1) à chaque nœud, une liste doublement chaînée maintient l'ordre d'utilisation pour déplacer un élément accédé en tête et évincer la queue en O(1) quand la capacité est dépassée. C'est une structure incontournable car elle correspond directement à un cache d'images.",
      "ios": "NSCache applique une éviction automatique sous pression mémoire, mais Apple ne documente pas d'ordre LRU strict garanti ; on la réimplémente à la main quand un ordre LRU précis est requis, par exemple un cache d'images à capacité fixe.",
      "android": "LruCache<K, V> de androidx.collection l'implémente nativement ; Coil s'appuie dessus pour son cache mémoire d'images, exposé côté Compose via AsyncImage.",
      "keywords": ["LRU", "hash map + linked list", "NSCache", "LruCache", "eviction policy"],
      "docUrl": "https://en.wikipedia.org/wiki/Cache_replacement_policies",
      "practiceUrl": "https://leetcode.com/problems/lru-cache/",
      "exercises": [
        {
          "level": "facile",
          "title": "Cache LRU basique",
          "statement": "Implémenter une cache à capacité fixe avec deux opérations : get(key) qui renvoie la valeur associée (ou une absence), et put(key, value) qui insère ou met à jour une valeur. Quand la capacité est dépassée, évincer l'élément le moins récemment utilisé — un accès en lecture OU en écriture sur une clé la rend « récemment utilisée ».",
          "swift": {
            "signature": "class LRUCache {\n    init(capacity: Int) { }\n    func get(_ key: Int) -> Int? { }\n    func put(_ key: Int, _ value: Int) { }\n}",
            "solution": "class LRUCache {\n    private let capacity: Int\n    private var store: [Int: Int] = [:]\n    private var order: [Int] = [] // du moins récent au plus récent\n\n    init(capacity: Int) {\n        self.capacity = capacity\n    }\n\n    func get(_ key: Int) -> Int? {\n        guard let value = store[key] else { return nil }\n        touch(key)\n        return value\n    }\n\n    func put(_ key: Int, _ value: Int) {\n        if store[key] == nil, store.count >= capacity {\n            let oldest = order.removeFirst()\n            store.removeValue(forKey: oldest)\n        }\n        store[key] = value\n        touch(key)\n    }\n\n    private func touch(_ key: Int) {\n        order.removeAll { $0 == key }\n        order.append(key)\n    }\n}"
          },
          "kotlin": {
            "signature": "class LRUCache(private val capacity: Int) {\n    fun get(key: Int): Int? { }\n    fun put(key: Int, value: Int) { }\n}",
            "solution": "class LRUCache(private val capacity: Int) {\n    private val store = HashMap<Int, Int>()\n    private val order = mutableListOf<Int>() // du moins récent au plus récent\n\n    fun get(key: Int): Int? {\n        val value = store[key] ?: return null\n        touch(key)\n        return value\n    }\n\n    fun put(key: Int, value: Int) {\n        if (!store.containsKey(key) && store.size >= capacity) {\n            val oldest = order.removeAt(0)\n            store.remove(oldest)\n        }\n        store[key] = value\n        touch(key)\n    }\n\n    private fun touch(key: Int) {\n        order.remove(key)\n        order.add(key)\n    }\n}"
          },
          "tests": [
            { "input": "capacity=2; put(1,10); put(2,20); get(1)", "output": "10 (et la clé 1 redevient la plus récente)" },
            { "input": "suite: put(3,30) puis get(2)", "output": "absent (clé 2 évincée, c'était la moins récente)" }
          ]
        },
        {
          "level": "moyen",
          "title": "Cache LRU redimensionnable",
          "statement": "Étendre la cache LRU pour supporter resize(newCapacity), qui change la capacité à chaud. Si la nouvelle capacité est inférieure au nombre d'éléments actuellement en cache, évincer immédiatement les éléments les moins récemment utilisés jusqu'à revenir sous la nouvelle capacité.",
          "swift": {
            "signature": "class ResizableLRUCache {\n    init(capacity: Int) { }\n    func get(_ key: Int) -> Int? { }\n    func put(_ key: Int, _ value: Int) { }\n    func resize(_ newCapacity: Int) { }\n}",
            "solution": "class ResizableLRUCache {\n    private var capacity: Int\n    private var store: [Int: Int] = [:]\n    private var order: [Int] = []\n\n    init(capacity: Int) {\n        self.capacity = capacity\n    }\n\n    func get(_ key: Int) -> Int? {\n        guard let value = store[key] else { return nil }\n        touch(key)\n        return value\n    }\n\n    func put(_ key: Int, _ value: Int) {\n        if store[key] == nil, store.count >= capacity {\n            evictOldest()\n        }\n        store[key] = value\n        touch(key)\n    }\n\n    func resize(_ newCapacity: Int) {\n        capacity = newCapacity\n        while store.count > capacity {\n            evictOldest()\n        }\n    }\n\n    private func evictOldest() {\n        guard !order.isEmpty else { return }\n        let oldest = order.removeFirst()\n        store.removeValue(forKey: oldest)\n    }\n\n    private func touch(_ key: Int) {\n        order.removeAll { $0 == key }\n        order.append(key)\n    }\n}"
          },
          "kotlin": {
            "signature": "class ResizableLRUCache(private var capacity: Int) {\n    fun get(key: Int): Int? { }\n    fun put(key: Int, value: Int) { }\n    fun resize(newCapacity: Int) { }\n}",
            "solution": "class ResizableLRUCache(private var capacity: Int) {\n    private val store = HashMap<Int, Int>()\n    private val order = mutableListOf<Int>()\n\n    fun get(key: Int): Int? {\n        val value = store[key] ?: return null\n        touch(key)\n        return value\n    }\n\n    fun put(key: Int, value: Int) {\n        if (!store.containsKey(key) && store.size >= capacity) {\n            evictOldest()\n        }\n        store[key] = value\n        touch(key)\n    }\n\n    fun resize(newCapacity: Int) {\n        capacity = newCapacity\n        while (store.size > capacity) {\n            evictOldest()\n        }\n    }\n\n    private fun evictOldest() {\n        if (order.isEmpty()) return\n        val oldest = order.removeAt(0)\n        store.remove(oldest)\n    }\n\n    private fun touch(key: Int) {\n        order.remove(key)\n        order.add(key)\n    }\n}"
          },
          "tests": [
            { "input": "capacity=3; put(1,1); put(2,2); put(3,3); resize(1)", "output": "seule la clé 3 (la plus récente) reste en cache" },
            { "input": "capacity=2; put(1,1); get(1); put(2,2); resize(5); put(3,3)", "output": "aucune éviction, les 3 clés sont présentes" }
          ]
        },
        {
          "level": "difficile",
          "title": "Cache LRU avec expiration (TTL)",
          "statement": "Chaque entrée a une durée de vie (TTL en secondes) au-delà de laquelle elle est considérée absente, même si la capacité n'est pas dépassée et même si l'entrée n'a pas été évincée par LRU. put(key, value, ttlSeconds) associe un TTL à l'entrée ; get(key) doit renvoyer une absence si l'entrée a expiré (et la retirer du cache au passage), sinon se comporter comme un accès LRU normal. Pour rester testable, l'horloge est injectée plutôt que lue depuis l'horloge système.",
          "swift": {
            "signature": "class ExpiringLRUCache {\n    init(capacity: Int, now: @escaping () -> Double) { }\n    func get(_ key: Int) -> Int? { }\n    func put(_ key: Int, _ value: Int, ttlSeconds: Double) { }\n}",
            "solution": "class ExpiringLRUCache {\n    private struct Entry { var value: Int; var expiresAt: Double }\n    private let capacity: Int\n    private let now: () -> Double\n    private var store: [Int: Entry] = [:]\n    private var order: [Int] = []\n\n    init(capacity: Int, now: @escaping () -> Double) {\n        self.capacity = capacity\n        self.now = now\n    }\n\n    func get(_ key: Int) -> Int? {\n        guard let entry = store[key] else { return nil }\n        if entry.expiresAt <= now() {\n            store.removeValue(forKey: key)\n            order.removeAll { $0 == key }\n            return nil\n        }\n        touch(key)\n        return entry.value\n    }\n\n    func put(_ key: Int, _ value: Int, ttlSeconds: Double) {\n        if store[key] == nil, store.count >= capacity {\n            let oldest = order.removeFirst()\n            store.removeValue(forKey: oldest)\n        }\n        store[key] = Entry(value: value, expiresAt: now() + ttlSeconds)\n        touch(key)\n    }\n\n    private func touch(_ key: Int) {\n        order.removeAll { $0 == key }\n        order.append(key)\n    }\n}"
          },
          "kotlin": {
            "signature": "class ExpiringLRUCache(\n    private val capacity: Int,\n    private val now: () -> Long\n) {\n    fun get(key: Int): Int? { }\n    fun put(key: Int, value: Int, ttlSeconds: Long) { }\n}",
            "solution": "class ExpiringLRUCache(\n    private val capacity: Int,\n    private val now: () -> Long\n) {\n    private data class Entry(val value: Int, val expiresAt: Long)\n    private val store = HashMap<Int, Entry>()\n    private val order = mutableListOf<Int>()\n\n    fun get(key: Int): Int? {\n        val entry = store[key] ?: return null\n        if (entry.expiresAt <= now()) {\n            store.remove(key)\n            order.remove(key)\n            return null\n        }\n        touch(key)\n        return entry.value\n    }\n\n    fun put(key: Int, value: Int, ttlSeconds: Long) {\n        if (!store.containsKey(key) && store.size >= capacity) {\n            val oldest = order.removeAt(0)\n            store.remove(oldest)\n        }\n        store[key] = Entry(value, now() + ttlSeconds)\n        touch(key)\n    }\n\n    private fun touch(key: Int) {\n        order.remove(key)\n        order.add(key)\n    }\n}"
          },
          "tests": [
            { "input": "horloge simulée t=0 ; put(1, 100, ttlSeconds=10) ; horloge → t=5 ; get(1)", "output": "100 (pas encore expiré)" },
            { "input": "suite : horloge → t=11 ; get(1)", "output": "absent (expiré, même si jamais évincé par LRU)" }
          ]
        }
      ]
    },
```

- [ ] **Step 3: Run the validator and confirm only `lru-cache` is clean**

Run: `node validate-algorithms.js`
Expected: exit code `1`; the error list no longer contains any `[lru-cache]` line, but still lists errors for the other 16 algorithm ids.

- [ ] **Step 4: Commit**

```bash
git add algorithms.json
git commit -m "Add exercises and doc/practice links for LRU Cache"
```

---

### Task 3: Result panel HTML scaffolding

**Files:**
- Modify: `index.html:34-45`

**Interfaces:**
- Produces: DOM elements `#result-links` (containing `#result-doc-link`, `#result-practice-link`) and `#result-exercises`, both present in every page load, consumed by Task 4's `wheel.js` changes.

- [ ] **Step 1: Insert the new containers between `.result-platforms` and `#relaunch-btn`**

In `index.html`, replace:

```html
      <div class="result-platforms">
        <div class="platform-card">
          <h3>🍎 iOS</h3>
          <p id="result-ios"></p>
        </div>
        <div class="platform-card">
          <h3>🤖 Android</h3>
          <p id="result-android"></p>
        </div>
      </div>
      <button id="relaunch-btn" type="button">Relancer</button>
```

with:

```html
      <div class="result-platforms">
        <div class="platform-card">
          <h3>🍎 iOS</h3>
          <p id="result-ios"></p>
        </div>
        <div class="platform-card">
          <h3>🤖 Android</h3>
          <p id="result-android"></p>
        </div>
      </div>
      <div id="result-links" class="result-links">
        <a id="result-doc-link" class="result-link" href="#" target="_blank" rel="noopener" hidden>📖 Doc approfondie</a>
        <a id="result-practice-link" class="result-link" href="#" target="_blank" rel="noopener" hidden>💻 S'entraîner</a>
      </div>
      <div id="result-exercises" class="result-exercises"></div>
      <button id="relaunch-btn" type="button">Relancer</button>
```

- [ ] **Step 2: Verify the page still loads without errors**

Run: `python -m http.server 8000` from the repo root, open `http://localhost:8000/` in a browser, open the devtools console.
Expected: no console errors; spinning the wheel still opens the result panel exactly as before (the two new containers are empty and invisible — `#result-doc-link`/`#result-practice-link` carry `hidden`, `#result-exercises` has no children yet).

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "Add result panel containers for doc/practice links and exercises"
```

---

### Task 4: Exercise accordion rendering (JS + CSS)

**Files:**
- Modify: `wheel.js:9-24` (DOM refs), `wheel.js:166-181` (`showResult`), `wheel.js:246-263` (`init`)
- Modify: `style.css:1-9` (`:root`), append after `style.css:205` (end of the `@media (max-width: 600px)` block for `.result-platforms`)

**Interfaces:**
- Consumes: `#result-links`, `#result-doc-link`, `#result-practice-link`, `#result-exercises` from Task 3; `algorithm.docUrl` (string), `algorithm.practiceUrl` (string, optional), `algorithm.exercises` (array of 3, schema from Task 1) from Task 2's data shape.
- Produces: `renderResultLinks(algorithm)`, `renderExercises(exercises)`, `buildExerciseElement(exercise)`, `buildLangPanel(lang, code, isActive)`, `handleExercisesClick(event)` — called from the extended `showResult(algorithm)`.

- [ ] **Step 1: Add the new DOM references**

In `wheel.js`, after line 19 (`const resultAndroid = document.getElementById('result-android');`), add:

```javascript
const resultDocLink = document.getElementById('result-doc-link');
const resultPracticeLink = document.getElementById('result-practice-link');
const resultExercises = document.getElementById('result-exercises');
```

- [ ] **Step 2: Add the level label lookup near the top-level constants**

After the `PALETTE` constant declaration (`wheel.js:7`), add:

```javascript
const LEVEL_LABELS = { facile: 'Facile', moyen: 'Moyen', difficile: 'Difficile' };
```

- [ ] **Step 3: Add the rendering functions**

Insert these functions immediately before `function showResult(algorithm) {` (`wheel.js:166`):

```javascript
function renderResultLinks(algorithm) {
  if (algorithm.docUrl) {
    resultDocLink.href = algorithm.docUrl;
    resultDocLink.hidden = false;
  } else {
    resultDocLink.hidden = true;
  }
  if (algorithm.practiceUrl) {
    resultPracticeLink.href = algorithm.practiceUrl;
    resultPracticeLink.hidden = false;
  } else {
    resultPracticeLink.hidden = true;
  }
}

function buildLangPanel(lang, code, isActive) {
  const panel = document.createElement('div');
  panel.className = 'lang-panel';
  panel.dataset.lang = lang;
  panel.hidden = !isActive;

  const signature = document.createElement('pre');
  signature.className = 'code-block signature';
  const signatureCode = document.createElement('code');
  signatureCode.textContent = code.signature;
  signature.appendChild(signatureCode);

  const solution = document.createElement('pre');
  solution.className = 'code-block solution';
  solution.hidden = true;
  const solutionCode = document.createElement('code');
  solutionCode.textContent = code.solution;
  solution.appendChild(solutionCode);

  panel.append(signature, solution);
  return panel;
}

function buildExerciseElement(exercise) {
  const details = document.createElement('details');
  details.className = 'exercise';
  details.dataset.level = exercise.level;

  const summary = document.createElement('summary');
  summary.textContent = `${LEVEL_LABELS[exercise.level]} — ${exercise.title}`;
  details.appendChild(summary);

  const body = document.createElement('div');
  body.className = 'exercise-body';

  const statement = document.createElement('p');
  statement.className = 'exercise-statement';
  statement.textContent = exercise.statement;
  body.appendChild(statement);

  const tabs = document.createElement('div');
  tabs.className = 'lang-tabs';
  const swiftTab = document.createElement('button');
  swiftTab.type = 'button';
  swiftTab.className = 'lang-tab active';
  swiftTab.dataset.lang = 'swift';
  swiftTab.textContent = 'Swift';
  const kotlinTab = document.createElement('button');
  kotlinTab.type = 'button';
  kotlinTab.className = 'lang-tab';
  kotlinTab.dataset.lang = 'kotlin';
  kotlinTab.textContent = 'Kotlin';
  tabs.append(swiftTab, kotlinTab);
  body.appendChild(tabs);

  body.appendChild(buildLangPanel('swift', exercise.swift, true));
  body.appendChild(buildLangPanel('kotlin', exercise.kotlin, false));

  const tests = document.createElement('div');
  tests.className = 'exercise-tests';
  exercise.tests.forEach((test) => {
    const line = document.createElement('p');
    line.className = 'exercise-test';
    const input = document.createElement('code');
    input.textContent = test.input;
    const output = document.createElement('code');
    output.textContent = test.output;
    line.append(input, ' → ', output);
    tests.appendChild(line);
  });
  body.appendChild(tests);

  const revealBtn = document.createElement('button');
  revealBtn.type = 'button';
  revealBtn.className = 'reveal-btn';
  revealBtn.textContent = 'Révéler la solution';
  body.appendChild(revealBtn);

  details.appendChild(body);
  return details;
}

function renderExercises(exercises) {
  resultExercises.replaceChildren(...exercises.map(buildExerciseElement));
}

function handleExercisesClick(event) {
  const tab = event.target.closest('.lang-tab');
  if (tab) {
    const exercise = tab.closest('.exercise');
    const lang = tab.dataset.lang;
    exercise.querySelectorAll('.lang-tab').forEach((btn) => {
      btn.classList.toggle('active', btn === tab);
    });
    exercise.querySelectorAll('.lang-panel').forEach((panel) => {
      panel.hidden = panel.dataset.lang !== lang;
    });
    return;
  }

  const revealBtn = event.target.closest('.reveal-btn');
  if (revealBtn) {
    const exercise = revealBtn.closest('.exercise');
    const revealed = exercise.classList.toggle('solution-revealed');
    exercise.querySelectorAll('.code-block.solution').forEach((solution) => {
      solution.hidden = !revealed;
    });
    revealBtn.textContent = revealed ? 'Masquer la solution' : 'Révéler la solution';
  }
}
```

- [ ] **Step 4: Wire the new rendering into `showResult`**

In `wheel.js`, replace the `showResult` function (`wheel.js:166-181`):

```javascript
function showResult(algorithm) {
  resultName.textContent = algorithm.name;
  resultDescription.textContent = algorithm.fullDescription;
  resultKeywords.replaceChildren(
    ...algorithm.keywords.map((keyword) => {
      const pill = document.createElement('span');
      pill.className = 'keyword-pill';
      pill.textContent = keyword;
      return pill;
    })
  );
  resultIos.textContent = algorithm.ios;
  resultAndroid.textContent = algorithm.android;
  relaunchButton.textContent = currentView === 'list' ? 'Fermer' : 'Relancer';
  resultPanel.hidden = false;
}
```

with:

```javascript
function showResult(algorithm) {
  resultName.textContent = algorithm.name;
  resultDescription.textContent = algorithm.fullDescription;
  resultKeywords.replaceChildren(
    ...algorithm.keywords.map((keyword) => {
      const pill = document.createElement('span');
      pill.className = 'keyword-pill';
      pill.textContent = keyword;
      return pill;
    })
  );
  resultIos.textContent = algorithm.ios;
  resultAndroid.textContent = algorithm.android;
  renderResultLinks(algorithm);
  renderExercises(algorithm.exercises);
  relaunchButton.textContent = currentView === 'list' ? 'Fermer' : 'Relancer';
  resultPanel.hidden = false;
}
```

- [ ] **Step 5: Register the delegated click listener in `init`**

In `wheel.js`, in `init()` (`wheel.js:246-263`), after the line `relaunchButton.addEventListener('click', hideResultPanel);`, add:

```javascript
  resultExercises.addEventListener('click', handleExercisesClick);
```

- [ ] **Step 6: Run the JS syntax check**

Run: `node --check wheel.js`
Expected: no output, exit code `0`.

- [ ] **Step 7: Add the level color variables**

In `style.css`, replace the `:root` block (`style.css:1-9`):

```css
:root {
  --bg: #170b2e;
  --bg-alt: #241247;
  --text: #fdf6ff;
  --accent: #ffd60a;
  --accent-dark: #e6ac00;
  --card-bg: #2c1650;
  --shadow: rgba(0, 0, 0, 0.4);
}
```

with:

```css
:root {
  --bg: #170b2e;
  --bg-alt: #241247;
  --text: #fdf6ff;
  --accent: #ffd60a;
  --accent-dark: #e6ac00;
  --card-bg: #2c1650;
  --shadow: rgba(0, 0, 0, 0.4);
  --level-facile: #06d6a0;
  --level-moyen: #f1a208;
  --level-difficile: #e63946;
}
```

- [ ] **Step 8: Append the exercise/link CSS**

At the end of `style.css` (after the closing `}` of the `#toggle-view-btn:disabled` rule, `style.css:290-294`), append:

```css
.result-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin: 0 0 1.5rem;
}

.result-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(255, 214, 10, 0.12);
  border: 1px solid rgba(255, 214, 10, 0.4);
  color: var(--accent);
  border-radius: 999px;
  padding: 0.45rem 1rem;
  font-size: clamp(0.85rem, 1.4vw, 1.05rem);
  font-weight: 600;
  text-decoration: none;
  transition: background 0.15s ease, transform 0.15s ease;
}

.result-link:hover {
  background: rgba(255, 214, 10, 0.22);
  transform: translateY(-1px);
}

.result-exercises {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 0 0 1.5rem;
}

.exercise {
  background: var(--bg-alt);
  border-radius: 16px;
  border-left: 4px solid var(--level-facile);
  overflow: hidden;
}

.exercise[data-level="moyen"] {
  border-left-color: var(--level-moyen);
}

.exercise[data-level="difficile"] {
  border-left-color: var(--level-difficile);
}

.exercise summary {
  cursor: pointer;
  padding: 1rem 1.25rem;
  font-weight: 700;
  font-size: clamp(1rem, 1.8vw, 1.2rem);
  list-style: none;
}

.exercise summary::-webkit-details-marker {
  display: none;
}

.exercise summary::before {
  content: '▸';
  display: inline-block;
  margin-right: 0.5rem;
  transition: transform 0.15s ease;
}

.exercise[open] summary::before {
  transform: rotate(90deg);
}

.exercise-body {
  padding: 0 1.25rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.exercise-statement {
  margin: 0;
  font-size: clamp(0.95rem, 1.6vw, 1.1rem);
  line-height: 1.5;
  opacity: 0.9;
}

.lang-tabs {
  display: flex;
  gap: 0.5rem;
}

.lang-tab {
  border: 1px solid rgba(255, 214, 10, 0.4);
  background: transparent;
  color: var(--text);
  border-radius: 999px;
  padding: 0.3rem 0.9rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

.lang-tab.active {
  background: var(--accent);
  color: #241247;
  border-color: var(--accent);
}

.lang-panel[hidden] {
  display: none;
}

.code-block {
  margin: 0;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 10px;
  padding: 0.9rem 1rem;
  font-family: "SF Mono", "Consolas", monospace;
  font-size: 0.85rem;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-x: auto;
}

.code-block.solution {
  margin-top: 0.6rem;
  border: 1px dashed rgba(255, 214, 10, 0.3);
}

.code-block.solution[hidden] {
  display: none;
}

.exercise-tests {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.exercise-test {
  margin: 0;
  font-size: 0.85rem;
  opacity: 0.85;
}

.exercise-test code {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  padding: 0.1rem 0.4rem;
}

.reveal-btn {
  align-self: flex-start;
  border: none;
  border-radius: 999px;
  background: var(--accent);
  color: #241247;
  font-weight: 700;
  padding: 0.5rem 1.25rem;
  cursor: pointer;
}
```

- [ ] **Step 9: Manual browser verification against the real LRU Cache data**

Run: `python -m http.server 8000` from the repo root, open `http://localhost:8000/`, click "📋 Voir la liste", click the "LRU Cache" row.
Expected: the result panel shows, below the iOS/Android cards, a "📖 Doc approfondie" link and a "💻 S'entraîner" link (both open the Wikipedia/LeetCode pages in a new tab), then 3 collapsed accordion rows labeled "Facile — Cache LRU basique", "Moyen — Cache LRU redimensionnable", "Difficile — Cache LRU avec expiration (TTL)". Expand one: the statement shows, a "Swift" tab is active showing the signature only, clicking "Kotlin" switches to the Kotlin signature, clicking "Révéler la solution" reveals the Swift or Kotlin solution (whichever tab is active) and the button label changes to "Masquer la solution"; switching tabs after reveal keeps the solution visible for both languages. No horizontal page scroll appears when the browser window is narrowed to ~375px wide.

- [ ] **Step 10: Commit**

```bash
git add wheel.js style.css
git commit -m "Render exercise accordion and doc/practice links in result panel"
```

---

### Task 5: Queue (FIFO) exercise content

**Files:**
- Modify: `algorithms.json` (the `queue-fifo` object, currently `algorithms.json:4-12`)

**Interfaces:**
- Consumes: `validate-algorithms.js` (Task 1), the schema and quality bar set by the `lru-cache` entry (Task 2).
- Produces: a fully populated `queue-fifo` entry.

Existing fields to preserve verbatim:
```json
{
  "id": "queue-fifo",
  "name": "Queue (FIFO)",
  "category": "structure",
  "summary": "File d'attente premier entré, premier sorti",
  "fullDescription": "Structure FIFO où l'élément inséré en premier est celui qui sort en premier. S'implémente efficacement avec un buffer circulaire (deux index tête/queue sur un tableau) ou une liste chaînée à deux extrémités, pour garder l'ajout et le retrait en O(1).",
  "ios": "Un tableau utilisé comme buffer circulaire, ou une DispatchQueue série (FIFO par construction) pour une file de tâches ; NSOperationQueue s'en rapproche mais exécute plusieurs opérations en concurrence par défaut — il faut maxConcurrentOperationCount = 1 pour garantir un traitement strictement séquentiel.",
  "android": "ArrayDeque en Kotlin pour une implémentation en mémoire, ou la file de tâches de WorkManager pour des files persistantes.",
  "keywords": ["FIFO", "buffer circulaire", "ArrayDeque", "DispatchQueue série", "head/tail pointer"]
}
```

- [ ] **Step 1: Research and verify `docUrl`/`practiceUrl`**

Candidates from the spec: `docUrl` = `https://en.wikipedia.org/wiki/Queue_(abstract_data_type)`; `practiceUrl` = `https://leetcode.com/problems/design-circular-queue/` (LeetCode 622, "Design Circular Queue"). Verify both with WebFetch (for `docUrl`) and WebSearch (for the LeetCode problem, since LeetCode blocks WebFetch with 403) before using them; if either candidate turns out dead or off-topic, replace it with another verified, relevant link (a well-known reference page for `docUrl`, any reputable coding-practice site for `practiceUrl`) — omit `practiceUrl` entirely only if no relevant practice problem can be found.

- [ ] **Step 2: Write 3 exercises (facile/moyen/difficile) matching the `lru-cache` template's structure**

For each level, write `title`, `statement` (French), `swift.signature`, `swift.solution`, `kotlin.signature`, `kotlin.solution`, and exactly 2 `tests` (`input`/`output` strings). Follow the queue's own theme (FIFO enqueue/dequeue on a fixed-size circular buffer): e.g. facile = basic `enqueue`/`dequeue`/`isEmpty` on a fixed-capacity queue; moyen = add a `peek` operation plus overflow behavior (reject or grow); difficile = support a second operation class (e.g. `enqueueFront` making it double-ended, or draining `n` items at once) — pick a progression that stays consistent with the FIFO/circular-buffer theme already described in `fullDescription`. Match the naive-solution-is-fine rule from the Global Constraints. Insert the complete object (existing fields + `docUrl` + `practiceUrl` + `exercises`) into `algorithms.json` in place of the current `queue-fifo` object.

- [ ] **Step 3: Run the validator and confirm only `queue-fifo` newly passes**

Run: `node validate-algorithms.js`
Expected: exit code `1` (other unfinished algorithms still fail); the error list no longer contains any `[queue-fifo]` line.

- [ ] **Step 4: Commit**

```bash
git add algorithms.json
git commit -m "Add exercises and doc/practice links for Queue (FIFO)"
```

---

### Task 6: Ring/Circular Buffer exercise content

**Files:**
- Modify: `algorithms.json` (the `ring-buffer` object, currently `algorithms.json:24-32`)

**Interfaces:**
- Consumes: `validate-algorithms.js` (Task 1), the schema/quality bar from Task 2.
- Produces: a fully populated `ring-buffer` entry.

Existing fields to preserve verbatim:
```json
{
  "id": "ring-buffer",
  "name": "Ring / Circular Buffer",
  "category": "structure",
  "summary": "Buffer circulaire pour flux continu de données",
  "fullDescription": "Tableau de taille fixe avec deux index (lecture/écriture) qui bouclent modulo la capacité, permettant d'écrire et lire en continu sans réallocation ni décalage d'éléments : une fois la capacité atteinte, chaque nouvelle écriture écrase la donnée la plus ancienne. Utilisé partout où des données arrivent en flux à débit régulier et où seules les N dernières valeurs comptent.",
  "ios": "Buffers audio d'AVAudioEngine, ou agrégation d'échantillons de capteurs (CoreMotion) avant traitement par lot.",
  "android": "Buffers d'AudioTrack/AudioRecord pour le flux audio, ou batching d'échantillons de capteurs via SensorManager.",
  "keywords": ["ring buffer", "circular buffer", "audio buffer", "AVAudioEngine", "SensorManager"]
}
```

- [ ] **Step 1: Research and verify `docUrl`/`practiceUrl`**

Candidates from the spec: `docUrl` = `https://en.wikipedia.org/wiki/Circular_buffer`; `practiceUrl` = `https://leetcode.com/problems/moving-average-from-data-stream/` (LeetCode 346, "Moving Average from Data Stream" — uses a fixed-size window internally, close to this algorithm's "keep only the N latest values" theme; deliberately different from `queue-fifo`'s practice link even though both structures are related). Verify both (WebFetch for `docUrl`, WebSearch for the LeetCode problem) before committing; replace if dead or off-topic.

- [ ] **Step 2: Write 3 exercises matching the template's structure**

Theme: fixed-capacity circular buffer that overwrites the oldest value once full. Facile = `write`/`readAll` with overwrite-when-full behavior; moyen = add an `average()`/`latest(n)` read helper over the current buffer contents; difficile = support buffer resizing or a "since last read" cursor that tracks what's already been consumed. Insert the complete object into `algorithms.json` in place of the current `ring-buffer` object.

- [ ] **Step 3: Run the validator and confirm only `ring-buffer` newly passes**

Run: `node validate-algorithms.js`
Expected: exit code `1`; the error list no longer contains any `[ring-buffer]` line.

- [ ] **Step 4: Commit**

```bash
git add algorithms.json
git commit -m "Add exercises and doc/practice links for Ring/Circular Buffer"
```

---

### Task 7: Stack exercise content

**Files:**
- Modify: `algorithms.json` (the `stack` object, currently `algorithms.json:34-42`)

**Interfaces:**
- Consumes: `validate-algorithms.js` (Task 1), the schema/quality bar from Task 2.
- Produces: a fully populated `stack` entry.

Existing fields to preserve verbatim:
```json
{
  "id": "stack",
  "name": "Stack",
  "category": "structure",
  "summary": "Pile LIFO, souvent adossée à un tableau",
  "fullDescription": "Structure LIFO (dernier entré, premier sorti) implémentée sur un tableau dynamique pour push/pop en O(1) amorti. La question piège classique porte sur le mécanisme de Copy-on-Write (COW) : un type valeur adossé à un tableau semble copié à chaque affectation, mais le buffer mémoire n'est réellement dupliqué qu'au premier accès en écriture après le partage — d'où les bonnes performances malgré des copies en apparence coûteuses.",
  "ios": "En Swift, Array est un struct dont la bibliothèque standard implémente le Copy-on-Write (via isKnownUniquelyReferenced), donc une copie ne duplique le buffer que si l'un des deux exemplaires est mutable ensuite ; ce COW n'est pas automatique pour un type maison enveloppant une classe, il faut l'implémenter soi-même de la même façon.",
  "android": "Kotlin n'a pas de COW natif sur ses collections mutables ; on discute plutôt de l'immutabilité par défaut des List/data class et des collections persistantes (kotlinx.collections.immutable) comme équivalent conceptuel.",
  "keywords": ["LIFO", "push/pop", "Copy-on-Write", "COW", "value type vs reference type"]
}
```

- [ ] **Step 1: Research and verify `docUrl`/`practiceUrl`**

Candidates from the spec: `docUrl` = `https://en.wikipedia.org/wiki/Stack_(abstract_data_type)`; `practiceUrl` = `https://leetcode.com/problems/min-stack/` (LeetCode 155, "Min Stack" — a stack augmented with O(1) minimum tracking). Verify both before committing; replace if dead or off-topic.

- [ ] **Step 2: Write 3 exercises matching the template's structure**

Theme: LIFO push/pop, progressing toward augmented stacks. Facile = basic `push`/`pop`/`peek`/`isEmpty`; moyen = `MinStack` returning the current minimum in O(1) (matches the `practiceUrl`); difficile = a stack supporting `popMultiple(n)` or two-stack-backed queue-like behavior (pick whichever gives a meaningfully harder scope than moyen). Insert the complete object into `algorithms.json` in place of the current `stack` object.

- [ ] **Step 3: Run the validator and confirm only `stack` newly passes**

Run: `node validate-algorithms.js`
Expected: exit code `1`; the error list no longer contains any `[stack]` line.

- [ ] **Step 4: Commit**

```bash
git add algorithms.json
git commit -m "Add exercises and doc/practice links for Stack"
```

---

### Task 8: Generic Linked List exercise content

**Files:**
- Modify: `algorithms.json` (the `linked-list` object, currently `algorithms.json:44-52`)

**Interfaces:**
- Consumes: `validate-algorithms.js` (Task 1), the schema/quality bar from Task 2.
- Produces: a fully populated `linked-list` entry.

Existing fields to preserve verbatim:
```json
{
  "id": "linked-list",
  "name": "Generic Linked List",
  "category": "structure",
  "summary": "Liste chaînée générique, souvent pour sonder la gestion mémoire",
  "fullDescription": "Implémentation d'une liste chaînée simple ou double, générique sur le type stocké. Rarement demandée pour elle-même : sert de prétexte pour vérifier la compréhension du cycle de vie mémoire quand chaque nœud référence le suivant (et parfois le précédent).",
  "ios": "Avec ARC, un pointeur arrière (précédent) fort créerait un cycle de rétention ; il doit être déclaré weak pour que la liste puisse être désallouée correctement.",
  "android": "Le garbage collector d'ART gère les cycles de références automatiquement, donc pas de fuite par cycle ; la discussion porte plutôt sur les fuites via des références statiques ou un DisposableEffect Compose sans onDispose pour désenregistrer un listener.",
  "keywords": ["linked list", "ARC", "retain cycle", "weak reference", "garbage collector"]
}
```

- [ ] **Step 1: Research and verify `docUrl`/`practiceUrl`**

Candidates from the spec: `docUrl` = `https://en.wikipedia.org/wiki/Linked_list`; `practiceUrl` = `https://leetcode.com/problems/linked-list-cycle/` (LeetCode 141, "Linked List Cycle" — ties directly into this algorithm's retain-cycle theme). Verify both before committing; replace if dead or off-topic.

- [ ] **Step 2: Write 3 exercises matching the template's structure**

Theme: singly/doubly linked list, with the hardest level touching cycle detection (matches `practiceUrl` and the ARC/retain-cycle angle in `ios`). Facile = `append`/`toArray` on a singly linked list; moyen = `reverse()` in place; difficile = `hasCycle()` using Floyd's tortoise-and-hare (naive O(n) with a visited set is an acceptable non-optimized solution per the Global Constraints). Insert the complete object into `algorithms.json` in place of the current `linked-list` object.

- [ ] **Step 3: Run the validator and confirm only `linked-list` newly passes**

Run: `node validate-algorithms.js`
Expected: exit code `1`; the error list no longer contains any `[linked-list]` line.

- [ ] **Step 4: Commit**

```bash
git add algorithms.json
git commit -m "Add exercises and doc/practice links for Generic Linked List"
```

---

### Task 9: Debounce / Throttle exercise content

**Files:**
- Modify: `algorithms.json` (the `debounce-throttle` object, currently `algorithms.json:54-62`)

**Interfaces:**
- Consumes: `validate-algorithms.js` (Task 1), the schema/quality bar from Task 2.
- Produces: a fully populated `debounce-throttle` entry.

Existing fields to preserve verbatim:
```json
{
  "id": "debounce-throttle",
  "name": "Debounce / Throttle",
  "category": "structure",
  "summary": "Limiter la fréquence d'appel d'une fonction, implémenté à la main",
  "fullDescription": "Le debounce retarde l'exécution d'une fonction jusqu'à ce qu'aucun nouvel appel n'ait eu lieu pendant un délai donné (annule et reprogramme à chaque appel) ; le throttle garantit au plus un appel par intervalle fixe. Les deux se codent à la main en gérant l'annulation du travail précédemment planifié.",
  "ios": "Un Task stocké dans une propriété, annulé (task?.cancel()) puis recréé à chaque appel ; il attend via Task.sleep(for:) puis vérifie Task.isCancelled avant d'exécuter l'action — l'idiome de concurrence structurée qui remplace DispatchWorkItem + DispatchQueue.asyncAfter.",
  "android": "Un Job de coroutine stocké dans une propriété, annulé (job.cancel()) puis relancé avec delay(...) dans un nouveau launch ; en Compose, l'idiome courant est snapshotFlow { state }.debounce(300).collectLatest { ... } dans un LaunchedEffect, qui gère l'annulation automatiquement à chaque recomposition.",
  "keywords": ["debounce", "throttle", "Task.sleep + cancellation", "structured concurrency", "rate limiting"]
}
```

- [ ] **Step 1: Research and verify `docUrl`, decide `practiceUrl`**

`docUrl` = `https://css-tricks.com/debouncing-throttling-explained-examples/` — already verified during design (confirmed to exist and cover both concepts with examples); still re-verify with WebFetch as a final check before committing, in case the page changed. For `practiceUrl`, search (WebSearch) for a debounce/throttle implementation challenge on a reputable front-end practice site (e.g. `bigfrontend.dev`, `greatfrontend.com`); only include `practiceUrl` if you find and verify a real, resolvable URL — omit the key entirely otherwise (do not fabricate a URL).

- [ ] **Step 2: Write 3 exercises matching the template's structure**

Theme: implement `debounce`/`throttle` as timer-based wrappers around a callback, testable via a simulated/injected clock rather than real `sleep` (same pattern as the LRU Cache TTL exercise). Facile = `debounce(fn, delayMs)` that cancels and reschedules on every call; moyen = `throttle(fn, intervalMs)` that guarantees at most one call per interval; difficile = a combined `debounce(fn, delayMs, maxWaitMs)` (debounce with a maximum wait, like Lodash's `maxWait` option) that eventually fires even under continuous calls. Insert the complete object into `algorithms.json` in place of the current `debounce-throttle` object.

- [ ] **Step 3: Run the validator and confirm only `debounce-throttle` newly passes**

Run: `node validate-algorithms.js`
Expected: exit code `1`; the error list no longer contains any `[debounce-throttle]` line.

- [ ] **Step 4: Commit**

```bash
git add algorithms.json
git commit -m "Add exercises and doc link for Debounce / Throttle"
```

---

### Task 10: Thread-safe Dictionary / Counter exercise content

**Files:**
- Modify: `algorithms.json` (the `thread-safe-counter` object, currently `algorithms.json:64-72`)

**Interfaces:**
- Consumes: `validate-algorithms.js` (Task 1), the schema/quality bar from Task 2.
- Produces: a fully populated `thread-safe-counter` entry.

Existing fields to preserve verbatim:
```json
{
  "id": "thread-safe-counter",
  "name": "Thread-safe Dictionary / Counter",
  "category": "structure",
  "summary": "Accès concurrent sûr à un état partagé mutable",
  "fullDescription": "Protéger un dictionnaire ou un compteur accédé depuis plusieurs threads simultanément, en comparant les approches : verrou exclusif simple, verrou lecteur/écrivain qui autorise les lectures concurrentes, ou modèle d'isolation par acteur qui sérialise les accès sans verrou explicite.",
  "ios": "OSAllocatedUnfairLock ou NSLock pour un verrou bas niveau performant, versus un actor Swift qui isole l'état et sérialise automatiquement les accès via des points de suspension async ; en mode strict concurrency de Swift 6, le compilateur refuse de toute façon un état mutable partagé non isolé entre tâches, rendant l'un de ces deux choix quasi obligatoire pour compiler.",
  "android": "synchronized ou un Mutex de coroutine pour protéger une MutableMap classique en exclusion mutuelle, ou un StateFlow<Map<...>> avec update{} atomique pour un compteur observable directement collectable depuis Compose.",
  "keywords": ["thread safety", "mutex", "actor", "race condition", "OSAllocatedUnfairLock"]
}
```

- [ ] **Step 1: Research and verify `docUrl`/`practiceUrl`**

Candidates from the spec: `docUrl` = `https://en.wikipedia.org/wiki/Race_condition`; `practiceUrl` = `https://leetcode.com/problems/print-in-order/` (LeetCode 1114, in LeetCode's Concurrency category — synchronizing execution order across threads). Verify both before committing; replace if dead or off-topic.

- [ ] **Step 2: Write 3 exercises matching the template's structure**

Theme: since actual multithreading can't be demonstrated in a static test list, phrase exercises around the *sequencing/synchronization logic* itself (matches `practiceUrl`'s "Print in Order" theme) rather than real concurrency — this is a reasonable adaptation given the constraint that tests are illustrative, not executed. Facile = a `Counter` with `increment()`/`value` (single-threaded correctness of the increment logic); moyen = a key-based counter (`increment(key)`/`value(key)`) mimicking a thread-safe map's public API; difficile = an ordering gate: an object with `first()`, `second()`, `third()` methods that must record calls in the order 1-2-3 regardless of call order, returning which calls were out-of-order (models the synchronization problem from LeetCode 1114 without real threads). Insert the complete object into `algorithms.json` in place of the current `thread-safe-counter` object.

- [ ] **Step 3: Run the validator and confirm only `thread-safe-counter` newly passes**

Run: `node validate-algorithms.js`
Expected: exit code `1`; the error list no longer contains any `[thread-safe-counter]` line.

- [ ] **Step 4: Commit**

```bash
git add algorithms.json
git commit -m "Add exercises and doc/practice links for Thread-safe Dictionary / Counter"
```

---

### Task 11: Two Pointers / Sliding Window exercise content

**Files:**
- Modify: `algorithms.json` (the `two-pointers` object, currently `algorithms.json:74-82`)

**Interfaces:**
- Consumes: `validate-algorithms.js` (Task 1), the schema/quality bar from Task 2.
- Produces: a fully populated `two-pointers` entry.

Existing fields to preserve verbatim:
```json
{
  "id": "two-pointers",
  "name": "Two Pointers / Sliding Window",
  "category": "algorithme",
  "summary": "Plus longue sous-chaîne sans répétition, fenêtre glissante",
  "fullDescription": "Deux index parcourent une séquence en maintenant une fenêtre valide : l'un avance pour étendre la fenêtre, l'autre pour la réduire quand une contrainte est violée (ex: caractère dupliqué), le tout en O(n) au lieu d'une recherche par force brute en O(n²).",
  "ios": "Un exercice de manipulation de String en Swift, où il faut composer avec les index non entiers du type String (String.Index) plutôt qu'un simple compteur.",
  "android": "Le même algorithme sur une String Kotlin, dont les index sont de simples Int, ce qui rend l'implémentation légèrement plus directe qu'en Swift.",
  "keywords": ["two pointers", "sliding window", "longest substring", "O(n)", "String.Index"]
}
```

- [ ] **Step 1: Research and verify `docUrl`/`practiceUrl`**

`docUrl` = `https://www.geeksforgeeks.org/dsa/two-pointers-technique/` — already verified during design (confirmed via web search to exist and cover the technique); re-verify with WebFetch before committing. `practiceUrl` = `https://leetcode.com/problems/longest-substring-without-repeating-characters/` (LeetCode 3 — exact match with `fullDescription`); verify via WebSearch before committing.

- [ ] **Step 2: Write 3 exercises matching the template's structure**

Theme: sliding window over a string/array. Facile = "longest substring with all unique characters" (matches `practiceUrl` directly); moyen = "smallest window containing at least K distinct characters" or "longest substring with at most K distinct characters"; difficile = "minimum window substring containing every character of a target string" (LeetCode 76-style, but written as a self-contained statement). Insert the complete object into `algorithms.json` in place of the current `two-pointers` object.

- [ ] **Step 3: Run the validator and confirm only `two-pointers` newly passes**

Run: `node validate-algorithms.js`
Expected: exit code `1`; the error list no longer contains any `[two-pointers]` line.

- [ ] **Step 4: Commit**

```bash
git add algorithms.json
git commit -m "Add exercises and doc/practice links for Two Pointers / Sliding Window"
```

---

### Task 12: Binary Search exercise content

**Files:**
- Modify: `algorithms.json` (the `binary-search` object, currently `algorithms.json:84-92`)

**Interfaces:**
- Consumes: `validate-algorithms.js` (Task 1), the schema/quality bar from Task 2.
- Produces: a fully populated `binary-search` entry.

Existing fields to preserve verbatim:
```json
{
  "id": "binary-search",
  "name": "Binary Search",
  "category": "algorithme",
  "summary": "Recherche dichotomique, souvent pour une liste paginée triée",
  "fullDescription": "Recherche en O(log n) dans une collection triée en comparant systématiquement l'élément du milieu et en réduisant l'intervalle de moitié. Se présente souvent comme : trouver l'index d'insertion d'un nouvel élément dans une liste déjà triée et déjà partiellement chargée par pagination.",
  "ios": "Recherche de la position d'insertion dans les données déjà chargées d'une List SwiftUI paginée, avant de fusionner une nouvelle page de résultats triés.",
  "android": "Même problème côté LazyColumn avec les données de la bibliothèque Paging3 (androidx.paging.compose), où il faut positionner de nouveaux éléments triés dans une liste déjà partiellement chargée.",
  "keywords": ["binary search", "dichotomie", "O(log n)", "insertion index", "sorted array"]
}
```

- [ ] **Step 1: Research and verify `docUrl`/`practiceUrl`**

Candidates from the spec: `docUrl` = `https://en.wikipedia.org/wiki/Binary_search_algorithm`; `practiceUrl` = `https://leetcode.com/problems/search-insert-position/` (LeetCode 35 — exact match with `fullDescription`'s insertion-index framing). Verify both before committing; replace if dead or off-topic.

- [ ] **Step 2: Write 3 exercises matching the template's structure**

Theme: dichotomic search on sorted data. Facile = classic `search(sortedArray, target) -> index?`; moyen = `insertionIndex(sortedArray, target) -> index` (matches `practiceUrl` directly); difficile = `firstAndLastPosition(sortedArray, target) -> (first, last)?` (find the range of a value that may repeat, LeetCode 34-style). Insert the complete object into `algorithms.json` in place of the current `binary-search` object.

- [ ] **Step 3: Run the validator and confirm only `binary-search` newly passes**

Run: `node validate-algorithms.js`
Expected: exit code `1`; the error list no longer contains any `[binary-search]` line.

- [ ] **Step 4: Commit**

```bash
git add algorithms.json
git commit -m "Add exercises and doc/practice links for Binary Search"
```

---

### Task 13: BFS/DFS sur un arbre exercise content

**Files:**
- Modify: `algorithms.json` (the `bfs-dfs-tree` object, currently `algorithms.json:94-102`)

**Interfaces:**
- Consumes: `validate-algorithms.js` (Task 1), the schema/quality bar from Task 2.
- Produces: a fully populated `bfs-dfs-tree` entry.

Existing fields to preserve verbatim:
```json
{
  "id": "bfs-dfs-tree",
  "name": "BFS/DFS sur un arbre",
  "category": "algorithme",
  "summary": "Parcours en largeur ou en profondeur d'une structure arborescente",
  "fullDescription": "Le parcours en largeur (BFS, via une file) traite les nœuds niveau par niveau ; le parcours en profondeur (DFS, via récursion ou une pile) descend une branche jusqu'au bout avant de revenir en arrière. Souvent posé sur un arbre concret plutôt qu'abstrait pour vérifier la traduction en code.",
  "ios": "Parcourir un modèle de données arborescent qui alimente une OutlineGroup ou une List(_:children:) SwiftUI pour trouver un nœud selon un critère, ou parcourir un arbre JSON décodé en structures imbriquées.",
  "android": "Parcourir un modèle de données arborescent qui alimente un composable récursif (un TreeNode(node) qui s'appelle lui-même pour ses enfants) pour trouver un nœud selon un critère, ou parcourir la même structure JSON imbriquée côté Kotlin.",
  "keywords": ["BFS", "DFS", "tree traversal", "recursion", "queue vs stack"]
}
```

- [ ] **Step 1: Research and verify `docUrl`/`practiceUrl`**

Candidates from the spec: `docUrl` = `https://en.wikipedia.org/wiki/Tree_traversal`; `practiceUrl` = `https://leetcode.com/problems/binary-tree-level-order-traversal/` (LeetCode 102, BFS on a tree). Verify both before committing; replace if dead or off-topic.

- [ ] **Step 2: Write 3 exercises matching the template's structure**

Theme: traverse a tree of nodes each holding children. Facile = `depthFirstValues(root) -> [values]` (pre-order DFS); moyen = `breadthFirstLevels(root) -> [[values per level]]` (matches `practiceUrl` directly); difficile = `find(root, predicate) -> path?` returning the path of node values from root to the first node matching a predicate, or `nil`/`null` if none matches. Insert the complete object into `algorithms.json` in place of the current `bfs-dfs-tree` object.

- [ ] **Step 3: Run the validator and confirm only `bfs-dfs-tree` newly passes**

Run: `node validate-algorithms.js`
Expected: exit code `1`; the error list no longer contains any `[bfs-dfs-tree]` line.

- [ ] **Step 4: Commit**

```bash
git add algorithms.json
git commit -m "Add exercises and doc/practice links for BFS/DFS sur un arbre"
```

---

### Task 14: Topological Sort exercise content

**Files:**
- Modify: `algorithms.json` (the `topological-sort` object, currently `algorithms.json:104-112`)

**Interfaces:**
- Consumes: `validate-algorithms.js` (Task 1), the schema/quality bar from Task 2.
- Produces: a fully populated `topological-sort` entry.

Existing fields to preserve verbatim:
```json
{
  "id": "topological-sort",
  "name": "Topological Sort",
  "category": "algorithme",
  "summary": "Ordonner des tâches selon leurs dépendances",
  "fullDescription": "Tri qui ordonne les nœuds d'un graphe orienté acyclique de sorte que chaque nœud apparaisse après toutes ses dépendances, typiquement via un parcours DFS avec pile de sortie ou un algorithme de Kahn basé sur les degrés entrants. Sert à valider qu'un candidat sait détecter les dépendances cycliques.",
  "ios": "Ordonnancer des Operation dans une OperationQueue via des dépendances explicites (addDependency), où un cycle de dépendances bloquerait la queue indéfiniment.",
  "android": "Chaîner des WorkRequest dans WorkManager (via then()/chain de travaux), l'équivalent conceptuel d'un graphe de tâches à exécuter dans le bon ordre.",
  "keywords": ["topological sort", "DAG", "dependency graph", "Kahn's algorithm", "cycle detection"]
}
```

- [ ] **Step 1: Research and verify `docUrl`/`practiceUrl`**

Candidates from the spec: `docUrl` = `https://en.wikipedia.org/wiki/Topological_sorting`; `practiceUrl` = `https://leetcode.com/problems/course-schedule/` (LeetCode 207 — exact match with `fullDescription`'s cycle-detection framing). Verify both before committing; replace if dead or off-topic.

- [ ] **Step 2: Write 3 exercises matching the template's structure**

Theme: order tasks given their dependencies. Facile = `hasCycle(graph) -> Bool`/`Boolean` on an adjacency-list DAG candidate; moyen = `topologicalOrder(graph) -> [nodes]?` returning `nil`/`null` if a cycle exists (matches `practiceUrl` directly); difficile = `topologicalOrder` that also reports, when a cycle exists, the list of node ids that are part of at least one cycle. Insert the complete object into `algorithms.json` in place of the current `topological-sort` object.

- [ ] **Step 3: Run the validator and confirm only `topological-sort` newly passes**

Run: `node validate-algorithms.js`
Expected: exit code `1`; the error list no longer contains any `[topological-sort]` line.

- [ ] **Step 4: Commit**

```bash
git add algorithms.json
git commit -m "Add exercises and doc/practice links for Topological Sort"
```

---

### Task 15: Merge Intervals exercise content

**Files:**
- Modify: `algorithms.json` (the `merge-intervals` object, currently `algorithms.json:114-122`)

**Interfaces:**
- Consumes: `validate-algorithms.js` (Task 1), the schema/quality bar from Task 2.
- Produces: a fully populated `merge-intervals` entry.

Existing fields to preserve verbatim:
```json
{
  "id": "merge-intervals",
  "name": "Merge Intervals",
  "category": "algorithme",
  "summary": "Fusionner des intervalles qui se chevauchent",
  "fullDescription": "Trier une liste d'intervalles par borne de début, puis les parcourir en fusionnant chaque intervalle avec le précédent dès que leurs bornes se chevauchent, en O(n log n) dominé par le tri. Le cas d'usage le plus fréquent : fusionner des événements de calendrier qui se recouvrent dans le temps.",
  "ios": "Fusionner des événements récupérés via EventKit (EKEvent) qui se chevauchent avant de les afficher dans une vue calendrier condensée.",
  "android": "Même logique sur des événements lus depuis le CalendarContract du SDK Android.",
  "keywords": ["merge intervals", "overlapping intervals", "sort by start", "EventKit", "calendar events"]
}
```

- [ ] **Step 1: Research and verify `docUrl`/`practiceUrl`**

`docUrl` = `https://www.geeksforgeeks.org/dsa/merging-intervals/` — already verified during design (confirmed via web search to exist); re-verify with WebFetch before committing. `practiceUrl` = `https://leetcode.com/problems/merge-intervals/` (LeetCode 56 — exact match); verify via WebSearch before committing.

- [ ] **Step 2: Write 3 exercises matching the template's structure**

Theme: sort-then-scan merge of overlapping ranges. Facile = `merge(intervals) -> mergedIntervals` on a list of `[start, end]` pairs (matches `practiceUrl` directly); moyen = `insert(intervals, newInterval) -> mergedIntervals` inserting one new interval into an already-sorted, already-merged list (LeetCode 57-style); difficile = `totalCoveredDuration(intervals) -> number` returning the total length covered by the union of all intervals without materializing the merged list. Insert the complete object into `algorithms.json` in place of the current `merge-intervals` object.

- [ ] **Step 3: Run the validator and confirm only `merge-intervals` newly passes**

Run: `node validate-algorithms.js`
Expected: exit code `1`; the error list no longer contains any `[merge-intervals]` line.

- [ ] **Step 4: Commit**

```bash
git add algorithms.json
git commit -m "Add exercises and doc/practice links for Merge Intervals"
```

---

### Task 16: Anagram / Frequency Counting exercise content

**Files:**
- Modify: `algorithms.json` (the `anagram-frequency` object, currently `algorithms.json:124-132`)

**Interfaces:**
- Consumes: `validate-algorithms.js` (Task 1), the schema/quality bar from Task 2.
- Produces: a fully populated `anagram-frequency` entry.

Existing fields to preserve verbatim:
```json
{
  "id": "anagram-frequency",
  "name": "Anagram / Frequency Counting",
  "category": "algorithme",
  "summary": "Comptage de fréquences par dictionnaire",
  "fullDescription": "Détecter des anagrammes ou regrouper des mots par signature en comptant l'occurrence de chaque caractère dans une hash map, puis en comparant ces signatures entre elles — une alternative en O(n) au tri des caractères de chaque mot.",
  "ios": "Un utilitaire générique de traitement de texte en Swift, indépendant de toute UI (SwiftUI ou autre).",
  "android": "Le même algorithme, écrit en Kotlin, tout aussi indépendant du SDK Android.",
  "keywords": ["anagram", "frequency map", "character count", "hash map", "sorting"]
}
```

- [ ] **Step 1: Research and verify `docUrl`/`practiceUrl`**

Candidates from the spec: `docUrl` = `https://en.wikipedia.org/wiki/Anagram`; `practiceUrl` = `https://leetcode.com/problems/group-anagrams/` (LeetCode 49 — exact match). Verify both before committing; replace if dead or off-topic.

- [ ] **Step 2: Write 3 exercises matching the template's structure**

Theme: character-frequency comparison. Facile = `isAnagram(a, b) -> Bool`/`Boolean`; moyen = `groupAnagrams(words) -> [[String]]` grouping a list of words by anagram signature (matches `practiceUrl` directly); difficile = `minWindowContainingAllChars(text, chars) -> String?` finding the shortest substring of `text` containing every character of `chars` at least once (a frequency-map sliding-window problem, distinct in scope from Task 11's window exercises since it targets multiset containment rather than distinct-character counting). Insert the complete object into `algorithms.json` in place of the current `anagram-frequency` object.

- [ ] **Step 3: Run the validator and confirm only `anagram-frequency` newly passes**

Run: `node validate-algorithms.js`
Expected: exit code `1`; the error list no longer contains any `[anagram-frequency]` line.

- [ ] **Step 4: Commit**

```bash
git add algorithms.json
git commit -m "Add exercises and doc/practice links for Anagram / Frequency Counting"
```

---

### Task 17: Diffing de listes exercise content

**Files:**
- Modify: `algorithms.json` (the `list-diffing` object, currently `algorithms.json:134-142`)

**Interfaces:**
- Consumes: `validate-algorithms.js` (Task 1), the schema/quality bar from Task 2.
- Produces: a fully populated `list-diffing` entry (no `practiceUrl` expected, per the spec's fallback for algorithms with no direct coding-judge equivalent).

Existing fields to preserve verbatim:
```json
{
  "id": "list-diffing",
  "name": "Diffing de listes",
  "category": "ios-specifique",
  "summary": "Calculer les changements entre deux versions d'une liste",
  "fullDescription": "Comparer une ancienne et une nouvelle liste de données pour produire un ensemble minimal d'insertions/suppressions/déplacements à animer, via un algorithme de diff façon Myers ou un diff simplifié basé sur des hash d'identité et d'égalité de contenu.",
  "ios": "En SwiftUI, ForEach(items) diffe automatiquement la liste dès lors que les éléments sont Identifiable avec un identifiant stable — jamais l'index — pour que le framework distingue correctement insertions, suppressions et déplacements et anime la transition.",
  "android": "En Compose, LazyColumn/LazyRow avec items(list, key = { it.id }) diffe automatiquement la liste à partir d'une clé stable — Compose ne recompose que les éléments dont la clé ou le contenu a changé, sans code de diff à écrire soi-même.",
  "keywords": ["list diffing", "Myers diff", "ForEach", "Identifiable", "stable id"]
}
```

- [ ] **Step 1: Research and verify `docUrl`; try to find a `practiceUrl`**

Candidate from the spec: `docUrl` = `https://en.wikipedia.org/wiki/Diff#Algorithms` (covers the Myers diff algorithm this entry's `fullDescription` names). Verify with WebFetch before committing; if the anchor doesn't resolve cleanly, fall back to `https://en.wikipedia.org/wiki/Diff` (verify too). Search (WebSearch) for a real practice problem computing a minimal edit script/diff between two lists (e.g. a LeetCode "Delete Operation for Two Strings"/edit-distance-adjacent problem); only set `practiceUrl` if you find and verify a genuinely relevant, resolvable URL — omit the key otherwise, per the spec's explicit fallback for this algorithm.

- [ ] **Step 2: Write 3 exercises matching the template's structure**

Theme: compute the minimal set of changes between an old and a new list of identifiable items (id + value), independent of any UI framework. Facile = `insertedIds(old, new) -> [ids]` and `removedIds(old, new) -> [ids]` (items present in one list but not the other, compared by id); moyen = `diff(old, new) -> (inserted, removed, updated)` also detecting same-id items whose value changed; difficile = `diff` extended to also report `moved` pairs (same id, same value, different index) alongside inserted/removed/updated, given that a real diff algorithm (Myers) must distinguish a move from a delete+insert. Insert the complete object into `algorithms.json` in place of the current `list-diffing` object.

- [ ] **Step 3: Run the validator and confirm only `list-diffing` newly passes**

Run: `node validate-algorithms.js`
Expected: exit code `1`; the error list no longer contains any `[list-diffing]` line.

- [ ] **Step 4: Commit**

```bash
git add algorithms.json
git commit -m "Add exercises and doc link for Diffing de listes"
```

---

### Task 18: Infinite Scroll exercise content

**Files:**
- Modify: `algorithms.json` (the `infinite-scroll` object, currently `algorithms.json:144-152`)

**Interfaces:**
- Consumes: `validate-algorithms.js` (Task 1), the schema/quality bar from Task 2.
- Produces: a fully populated `infinite-scroll` entry.

Existing fields to preserve verbatim:
```json
{
  "id": "infinite-scroll",
  "name": "Infinite Scroll",
  "category": "ios-specifique",
  "summary": "Chargement progressif avec annulation des requêtes obsolètes",
  "fullDescription": "Charger davantage de données quand l'utilisateur approche de la fin d'une liste, en définissant un seuil de prefetch avant le dernier élément visible, en annulant les requêtes devenues obsolètes si l'utilisateur scrolle vite, et en garantissant qu'une réponse tardive ne vienne jamais s'afficher sur la mauvaise ligne (à cause d'une cellule réutilisée ou d'une vue dont l'identité a changé).",
  "ios": "En SwiftUI, le modificateur .task sur chaque ligne d'une List lance le chargement et est automatiquement annulé dès que la ligne disparaît de l'écran, évitant qu'une réponse tardive n'écrase le contenu affiché ; .onAppear sur les dernières lignes déclenche le chargement de la page suivante au bon seuil de prefetch.",
  "android": "Paging3 gère nativement le seuil de prefetch et l'invalidation via LazyPagingItems dans un LazyColumn ; en implémentation manuelle, on observe LazyListState.firstVisibleItemIndex via derivedStateOf pour déclencher le chargement de la page suivante, et un LaunchedEffect(key) annule automatiquement la requête précédente à chaque recomposition.",
  "keywords": ["infinite scroll", "pagination", "prefetch threshold", ".task cancellation", "List lazy loading"]
}
```

- [ ] **Step 1: Research and verify `docUrl`; try to find a `practiceUrl`**

`docUrl` = `https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API` — the standard mechanism infinite-scroll prefetch thresholds are built on; verify with WebFetch before committing. Search (WebSearch) for a real front-end system-design or coding challenge specifically about infinite scroll/pagination with cancellation (e.g. on `greatfrontend.com` or `bigfrontend.dev`); only set `practiceUrl` if you find and verify a genuinely relevant, resolvable URL — omit the key otherwise.

- [ ] **Step 2: Write 3 exercises matching the template's structure**

Theme: paginated loading with a prefetch threshold and cancellation of stale requests, modeled without real network I/O (an injected `fetchPage(pageIndex) -> [items]` function stands in for the network call, same testability pattern as the LRU Cache TTL exercise's injected clock). Facile = `shouldLoadNextPage(visibleIndex, totalLoaded, prefetchThreshold) -> Bool`/`Boolean`; moyen = a `PageLoader` that calls `fetchPage` and appends results, exposing `items` and ignoring a call already in flight (no overlapping loads); difficile = the same `PageLoader`, but a new `scrollTo(index)` call must cancel/ignore the result of any in-flight page load for a page that's no longer needed (given an injected `fetchPage` that returns results out of order in the test, verify the loader keeps only the results still relevant). Insert the complete object into `algorithms.json` in place of the current `infinite-scroll` object.

- [ ] **Step 3: Run the validator and confirm only `infinite-scroll` newly passes**

Run: `node validate-algorithms.js`
Expected: exit code `1`; the error list no longer contains any `[infinite-scroll]` line.

- [ ] **Step 4: Commit**

```bash
git add algorithms.json
git commit -m "Add exercises and doc link for Infinite Scroll"
```

---

### Task 19: Image Cache exercise content

**Files:**
- Modify: `algorithms.json` (the `image-cache` object, currently `algorithms.json:154-162`)

**Interfaces:**
- Consumes: `validate-algorithms.js` (Task 1), the schema/quality bar from Task 2.
- Produces: a fully populated `image-cache` entry.

Existing fields to preserve verbatim:
```json
{
  "id": "image-cache",
  "name": "Image Cache",
  "category": "ios-specifique",
  "summary": "Cache mémoire + disque avec décodage hors thread principal",
  "fullDescription": "Cache à deux niveaux : un cache mémoire rapide (souvent LRU) pour l'accès immédiat, un cache disque persistant pour survivre aux redémarrages, avec une politique d'éviction basée sur la taille ou l'ancienneté, et un décodage d'image toujours effectué hors du thread principal pour ne pas bloquer l'interface.",
  "ios": "NSCache pour le niveau mémoire, un répertoire dans Caches/ pour le niveau disque, décodage via ImageIO sur une file de fond avant de repasser sur le thread principal pour l'affichage.",
  "android": "Coil implémente nativement ce cache à deux niveaux et s'intègre directement à Compose via AsyncImage ; en version manuelle, LruCache pour la mémoire, le cache disque d'OkHttp ou un répertoire dédié pour le disque, et décodage via BitmapFactory dans une coroutine sur Dispatchers.IO.",
  "keywords": ["image cache", "two-tier cache", "memory + disk", "Coil + AsyncImage", "background decoding"]
}
```

- [ ] **Step 1: Research and verify `docUrl`/`practiceUrl`**

Candidates from the spec: `docUrl` = `https://en.wikipedia.org/wiki/Cache_(computing)` (deliberately more general than `lru-cache`'s `docUrl`, since this entry's focus is the two-tier memory+disk architecture, not the eviction policy alone); `practiceUrl` = `https://leetcode.com/problems/lru-cache/` (LeetCode 146 — reused from Task 2's `lru-cache` entry, since an image cache's memory tier is itself an LRU cache; acceptable per the spec's "approximate match is fine" rule). Verify both before committing; replace if dead or off-topic.

- [ ] **Step 2: Write 3 exercises matching the template's structure**

Theme: two-tier cache (fast memory tier backed by a slower persistent tier), modeled without real disk/network I/O (injected `loadFromDisk(key) -> value?` and `saveToDisk(key, value)` functions stand in for I/O, same pattern as other injected-dependency exercises in this plan). Facile = a memory-only fixed-capacity cache with `get`/`put` (deliberately simpler reuse of the LRU shape, framed around image bytes/placeholder values instead of ints); moyen = add a disk fallback: `get(key)` checks memory first, then disk (populating memory on a disk hit) via the injected `loadFromDisk`; difficile = add write-through eviction: when memory evicts an entry, it must be persisted via `saveToDisk` before being dropped from memory, so a subsequent `get` still finds it on disk. Insert the complete object into `algorithms.json` in place of the current `image-cache` object.

- [ ] **Step 3: Run the validator and confirm only `image-cache` newly passes**

Run: `node validate-algorithms.js`
Expected: exit code `1`; the error list no longer contains any `[image-cache]` line.

- [ ] **Step 4: Commit**

```bash
git add algorithms.json
git commit -m "Add exercises and doc/practice links for Image Cache"
```

---

### Task 20: Flatten d'arbre imbriqué exercise content

**Files:**
- Modify: `algorithms.json` (the `flatten-tree` object, currently `algorithms.json:164-172`)

**Interfaces:**
- Consumes: `validate-algorithms.js` (Task 1), the schema/quality bar from Task 2.
- Produces: a fully populated `flatten-tree` entry.

Existing fields to preserve verbatim:
```json
{
  "id": "flatten-tree",
  "name": "Flatten d'arbre imbriqué",
  "category": "ios-specifique",
  "summary": "Aplatir une structure arborescente en liste sectionnée/expandable",
  "fullDescription": "Transformer une structure arborescente (sections, sous-sections, éléments) en une liste plate à une dimension adaptée à un composant de liste, en conservant la profondeur et l'état d'expansion de chaque nœud, et en ré-aplatissant dynamiquement quand une section est repliée ou dépliée.",
  "ios": "SwiftUI peut afficher une hiérarchie directement via List(data, children: \\.children) ou OutlineGroup sans aplatissement manuel ; l'exercice reste pertinent pour un layout personnalisé (LazyVStack) où l'on gère soi-même la profondeur et l'état d'expansion par identifiant de nœud.",
  "android": "Même aplatissement récursif, mais dans un LazyColumn : chaque item porte son niveau de profondeur pour l'indentation et un identifiant de nœud stable comme clé (key = node.id) pour l'état d'expansion — Compose n'a pas d'équivalent natif à un composant de liste hiérarchique, l'aplatissement reste donc la norme.",
  "keywords": ["flatten tree", "expandable list", "nested sections", "recursion", "LazyColumn stable key"]
}
```

- [ ] **Step 1: Research and verify `docUrl`/`practiceUrl`**

Candidates from the spec: `docUrl` = `https://en.wikipedia.org/wiki/Tree_(data_structure)`; `practiceUrl` = `https://leetcode.com/problems/flatten-binary-tree-to-linked-list/` (LeetCode 114 — approximate but directly named-matched "flatten" problem, per the spec's tolerance for close-enough practice links). Verify both before committing; replace if dead or off-topic.

- [ ] **Step 2: Write 3 exercises matching the template's structure**

Theme: flatten a tree of nodes (each with a depth-0 `children` array) into a single ordered list while tracking depth and expansion state. Facile = `flatten(root) -> [(value, depth)]` (unconditional full flatten, ignoring expansion state); moyen = `flatten(root, expandedIds) -> [(value, depth)]` that skips the children of any node whose id is not in `expandedIds` (collapsed sections don't contribute their descendants); difficile = `toggle(root, expandedIds, nodeId) -> newExpandedIds` plus re-flattening: given a click on `nodeId`, return the updated expansion set and confirm (via the two tests) that flattening with the new set correctly expands/collapses only that node's subtree. Insert the complete object into `algorithms.json` in place of the current `flatten-tree` object.

- [ ] **Step 3: Run the validator and confirm every algorithm now passes**

Run: `node validate-algorithms.js`
Expected: exit code `0`, stdout `OK: 17 algorithms validated.`

- [ ] **Step 4: Commit**

```bash
git add algorithms.json
git commit -m "Add exercises and doc/practice links for Flatten d'arbre imbriqué"
```

---

### Task 21: Final integration check

**Files:** none (verification only; no code changes expected)

**Interfaces:**
- Consumes: the complete `algorithms.json` from Tasks 2 and 5-20, the rendering from Task 4.

- [ ] **Step 1: Run both existing verification commands**

Run: `node --check wheel.js`
Expected: no output, exit code `0`.

Run: `node validate-algorithms.js`
Expected: exit code `0`, stdout `OK: 17 algorithms validated.`

- [ ] **Step 2: Manual browser check on 3 representative algorithms**

Run: `python -m http.server 8000` from the repo root, open `http://localhost:8000/`, click "📋 Voir la liste".

Click **"LRU Cache"**: confirm both "📖 Doc approfondie" and "💻 S'entraîner" links are visible; expand all 3 exercises one at a time, toggle Swift/Kotlin on at least one, click "Révéler la solution" and confirm it toggles back on a second click.

Click **"Diffing de listes"**: confirm "📖 Doc approfondie" is visible but "💻 S'entraîner" is absent (not just empty — the element itself should not take up visible space), since this entry has no `practiceUrl` (Task 17). If Task 17 did find and verify a real `practiceUrl`, confirm instead that both links show correctly.

Click **any third algorithm** (e.g. "Binary Search"): confirm the 3 exercise levels are labeled "Facile", "Moyen", "Difficile" in that order and the left border color differs per level (green/orange/red).

- [ ] **Step 3: Mobile-width check**

With the browser devtools open, switch to a narrow responsive viewport (~375px wide). Reopen the LRU Cache result and expand an exercise.
Expected: no horizontal scrollbar appears on the page itself; long code lines inside `.code-block` scroll horizontally within their own box instead of overflowing the page; the "📖"/"💻" links wrap to a second line if they don't fit side by side.

- [ ] **Step 4: Confirm no leftover uncommitted changes**

Run: `git status`
Expected: clean working tree (every task through Task 20 already committed its own changes).
