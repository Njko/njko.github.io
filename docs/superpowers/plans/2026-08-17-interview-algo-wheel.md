# Roue des algorithmes d'entretien — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repurpose `njko.github.io` into a spinning-wheel web game listing 17 interview data structures/algorithms, each with an iOS and Android angle, spun via a button with a 3-second decelerating animation.

**Architecture:** Zero-dependency static site (GitHub Pages). `algorithms.json` holds the data; `index.html` + `style.css` define structure/style; `wheel.js` handles data loading, Canvas 2D wheel rendering, spin animation (`requestAnimationFrame` + easeOutCubic), and the result panel. No backend, no build step, no test framework (matches existing repo convention).

**Tech Stack:** HTML5, CSS3, vanilla JavaScript (ES2017+), Canvas 2D API, Fetch API. No frameworks, no npm, no bundler.

**Spec:** `docs/superpowers/specs/2026-08-17-interview-algo-wheel-design.md`

## Global Constraints

- Zero dependency: no npm packages, no CDN scripts, no build step — plain `<script src="wheel.js">`.
- Content language: French for all UI copy, README, and algorithm descriptions (technical API names stay in their native English form, e.g. `DispatchWorkItem`, `LruCache`).
- Spin duration is exactly 3000ms, animated with an `easeOutCubic` easing curve for the deceleration effect.
- Tirage **avec remise**: every spin picks uniformly among all 17 items regardless of past results; no exclusion state.
- The algorithm list is fixed at exactly 17 items as enumerated in the spec — do not add, remove, or rename entries.
- No test framework exists in this repo; verification is via `node --check` (syntax), `node -e` (data validation), and manual browser checks against a local `python -m http.server` instance — consistent with the project's existing "no tests configured" convention.
- The old mood-tracker project (`index.html`, `moods.json`) is fully retired; no backward compatibility is preserved.

---

## Task 1: Author `algorithms.json` and retire old data

**Files:**
- Delete: `index.html` (old mood-tracker content — recreated fresh in Task 2)
- Delete: `moods.json`
- Create: `algorithms.json`

**Interfaces:**
- Produces: `algorithms.json` with top-level shape `{ "algorithms": [ { id, name, category, summary, fullDescription, ios, android }, ... ] }`, exactly 17 entries, all string fields non-empty. Every later task that reads algorithm data relies on these exact 7 field names.

- [ ] **Step 1: Remove the old mood-tracker files**

```bash
git rm index.html moods.json
```

- [ ] **Step 2: Create `algorithms.json` with all 17 entries**

Create `algorithms.json`:

```json
{
  "algorithms": [
    {
      "id": "queue-fifo",
      "name": "Queue (FIFO)",
      "category": "structure",
      "summary": "File d'attente premier entré, premier sorti",
      "fullDescription": "Structure FIFO où l'élément inséré en premier est celui qui sort en premier. S'implémente efficacement avec un buffer circulaire (deux index tête/queue sur un tableau) ou une liste chaînée à deux extrémités, pour garder l'ajout et le retrait en O(1).",
      "ios": "Un tableau utilisé comme buffer circulaire, ou NSOperationQueue pour une file de tâches à exécution séquentielle.",
      "android": "ArrayDeque en Kotlin pour une implémentation en mémoire, ou la file de tâches de WorkManager pour des files persistantes."
    },
    {
      "id": "lru-cache",
      "name": "LRU Cache",
      "category": "structure",
      "summary": "Dictionnaire + liste doublement chaînée",
      "fullDescription": "Cache à éviction LRU (Least Recently Used) : une hash map donne l'accès O(1) à chaque nœud, une liste doublement chaînée maintient l'ordre d'utilisation pour déplacer un élément accédé en tête et évincer la queue en O(1) quand la capacité est dépassée. C'est la structure la plus demandée en entretien car elle correspond directement à un cache d'images.",
      "ios": "NSCache s'inspire de ce principe ; on la réimplémente à la main pour contrôler précisément la politique d'éviction, par exemple un cache d'images limité en mémoire.",
      "android": "LruCache<K,V> du SDK Android l'implémente nativement ; Glide et Coil s'appuient dessus pour leur cache mémoire d'images."
    },
    {
      "id": "ring-buffer",
      "name": "Ring / Circular Buffer",
      "category": "structure",
      "summary": "Buffer circulaire pour flux continu de données",
      "fullDescription": "Tableau de taille fixe avec deux index (lecture/écriture) qui bouclent modulo la capacité, permettant d'écrire et lire en continu sans réallocation ni décalage d'éléments. Utilisé partout où des données arrivent en flux à débit régulier et où seules les N dernières valeurs comptent.",
      "ios": "Buffers audio d'AVAudioEngine, ou agrégation d'échantillons de capteurs (CoreMotion) avant traitement par lot.",
      "android": "Buffers d'AudioTrack/AudioRecord pour le flux audio, ou batching d'échantillons de capteurs via SensorManager."
    },
    {
      "id": "stack",
      "name": "Stack",
      "category": "structure",
      "summary": "Pile LIFO, souvent adossée à un tableau",
      "fullDescription": "Structure LIFO (dernier entré, premier sorti) implémentée sur un tableau dynamique pour push/pop en O(1) amorti. La question piège classique porte sur le comportement mémoire : pourquoi un type valeur adossé à un tableau reste performant malgré des copies apparentes.",
      "ios": "En Swift, un Stack basé sur Array est un struct ; le compilateur applique le Copy-on-Write, donc une copie ne duplique le buffer que si l'un des deux exemplaires est mutable ensuite.",
      "android": "Kotlin n'a pas de COW natif sur ses collections mutables ; on discute plutôt de l'immutabilité par défaut des List/data class et des collections persistantes (kotlinx.collections.immutable) comme équivalent conceptuel."
    },
    {
      "id": "linked-list",
      "name": "Generic Linked List",
      "category": "structure",
      "summary": "Liste chaînée générique, souvent pour sonder la gestion mémoire",
      "fullDescription": "Implémentation d'une liste chaînée simple ou double, générique sur le type stocké. Rarement demandée pour elle-même : sert de prétexte pour vérifier la compréhension du cycle de vie mémoire quand chaque nœud référence le suivant (et parfois le précédent).",
      "ios": "Avec ARC, un pointeur arrière (précédent) fort créerait un cycle de rétention ; il doit être déclaré weak pour que la liste puisse être désallouée correctement.",
      "android": "Le garbage collector de la JVM/ART gère les cycles de références automatiquement, donc pas de fuite par cycle ; la discussion porte plutôt sur les fuites via des références statiques ou des listeners non désenregistrés."
    },
    {
      "id": "debounce-throttle",
      "name": "Debounce / Throttle",
      "category": "structure",
      "summary": "Limiter la fréquence d'appel d'une fonction, implémenté à la main",
      "fullDescription": "Le debounce retarde l'exécution d'une fonction jusqu'à ce qu'aucun nouvel appel n'ait eu lieu pendant un délai donné (annule et reprogramme à chaque appel) ; le throttle garantit au plus un appel par intervalle fixe. Les deux se codent à la main en gérant l'annulation du travail précédemment planifié.",
      "ios": "DispatchWorkItem stocké dans une propriété, annulé (cancel()) puis reprogrammé via DispatchQueue.main.asyncAfter à chaque nouvel appel.",
      "android": "Un Job de coroutine stocké dans une propriété, annulé (job.cancel()) puis relancé avec delay(...) dans un nouveau launch, ou Handler.postDelayed avec removeCallbacks pour une approche sans coroutines."
    },
    {
      "id": "thread-safe-counter",
      "name": "Thread-safe Dictionary / Counter",
      "category": "structure",
      "summary": "Accès concurrent sûr à un état partagé mutable",
      "fullDescription": "Protéger un dictionnaire ou un compteur accédé depuis plusieurs threads simultanément, en comparant les approches : verrou exclusif simple, verrou lecteur/écrivain qui autorise les lectures concurrentes, ou modèle d'isolation par acteur qui sérialise les accès sans verrou explicite.",
      "ios": "OSAllocatedUnfairLock ou NSLock pour un verrou bas niveau performant, versus un actor Swift qui isole l'état et sérialise automatiquement les accès via des points de suspension async.",
      "android": "synchronized ou un Mutex de coroutine pour l'exclusion mutuelle, ConcurrentHashMap pour un dictionnaire thread-safe prêt à l'emploi, ou un StateFlow avec update{} atomique pour un compteur observable."
    },
    {
      "id": "two-pointers",
      "name": "Two Pointers / Sliding Window",
      "category": "algorithme",
      "summary": "Plus longue sous-chaîne sans répétition, fenêtre glissante",
      "fullDescription": "Deux index parcourent une séquence en maintenant une fenêtre valide : l'un avance pour étendre la fenêtre, l'autre pour la réduire quand une contrainte est violée (ex: caractère dupliqué), le tout en O(n) au lieu d'une recherche par force brute en O(n²).",
      "ios": "Un exercice de manipulation de String en Swift, où il faut composer avec les index non entiers du type String (String.Index) plutôt qu'un simple compteur.",
      "android": "Le même algorithme sur une String Kotlin, dont les index sont de simples Int, ce qui rend l'implémentation légèrement plus directe qu'en Swift."
    },
    {
      "id": "binary-search",
      "name": "Binary Search",
      "category": "algorithme",
      "summary": "Recherche dichotomique, souvent pour une liste paginée triée",
      "fullDescription": "Recherche en O(log n) dans une collection triée en comparant systématiquement l'élément du milieu et en réduisant l'intervalle de moitié. En entretien, souvent posée comme : trouver l'index d'insertion d'un nouvel élément dans une liste déjà triée et déjà partiellement chargée par pagination.",
      "ios": "Recherche de la position d'insertion dans les données déjà chargées d'une UITableView paginée, avant de fusionner une nouvelle page de résultats triés.",
      "android": "Même problème côté RecyclerView avec les données de la bibliothèque Paging3, où il faut positionner de nouveaux éléments triés dans une liste déjà partiellement chargée."
    },
    {
      "id": "bfs-dfs-tree",
      "name": "BFS/DFS sur un arbre",
      "category": "algorithme",
      "summary": "Parcours en largeur ou en profondeur d'une structure arborescente",
      "fullDescription": "Le parcours en largeur (BFS, via une file) traite les nœuds niveau par niveau ; le parcours en profondeur (DFS, via récursion ou une pile) descend une branche jusqu'au bout avant de revenir en arrière. Souvent posé sur un arbre concret plutôt qu'abstrait pour vérifier la traduction en code.",
      "ios": "Parcourir la hiérarchie de vues (UIView.subviews) pour trouver une vue par critère, ou parcourir un arbre JSON décodé en structures imbriquées.",
      "android": "Parcourir l'arbre de vues (ViewGroup.getChildAt) pour une recherche similaire, ou parcourir la même structure JSON imbriquée côté Kotlin."
    },
    {
      "id": "topological-sort",
      "name": "Topological Sort",
      "category": "algorithme",
      "summary": "Ordonner des tâches selon leurs dépendances",
      "fullDescription": "Tri qui ordonne les nœuds d'un graphe orienté acyclique de sorte que chaque nœud apparaisse après toutes ses dépendances, typiquement via un parcours DFS avec pile de sortie ou un algorithme de Kahn basé sur les degrés entrants. Sert à valider qu'un candidat sait détecter les dépendances cycliques.",
      "ios": "Ordonnancer des Operation dans une OperationQueue via des dépendances explicites (addDependency), où un cycle de dépendances bloquerait la queue indéfiniment.",
      "android": "Chaîner des WorkRequest dans WorkManager (via then()/chain de travaux), l'équivalent conceptuel d'un graphe de tâches à exécuter dans le bon ordre."
    },
    {
      "id": "merge-intervals",
      "name": "Merge Intervals",
      "category": "algorithme",
      "summary": "Fusionner des intervalles qui se chevauchent",
      "fullDescription": "Trier une liste d'intervalles par borne de début, puis les parcourir en fusionnant chaque intervalle avec le précédent dès que leurs bornes se chevauchent, en O(n log n) dominé par le tri. Le cas d'usage le plus fréquent en entretien : fusionner des événements de calendrier qui se recouvrent dans le temps.",
      "ios": "Fusionner des événements récupérés via EventKit (EKEvent) qui se chevauchent avant de les afficher dans une vue calendrier condensée.",
      "android": "Même logique sur des événements lus depuis le CalendarContract du SDK Android."
    },
    {
      "id": "anagram-frequency",
      "name": "Anagram / Frequency Counting",
      "category": "algorithme",
      "summary": "Comptage de fréquences par dictionnaire",
      "fullDescription": "Détecter des anagrammes ou regrouper des mots par signature en comptant l'occurrence de chaque caractère dans une hash map, puis en comparant ces signatures entre elles — une alternative en O(n) au tri des caractères de chaque mot.",
      "ios": "Un utilitaire générique de traitement de texte en Swift, sans dépendance particulière à une API UIKit.",
      "android": "Le même algorithme, écrit en Kotlin, tout aussi indépendant du SDK Android."
    },
    {
      "id": "list-diffing",
      "name": "Diffing de listes",
      "category": "ios-specifique",
      "summary": "Calculer les changements entre deux versions d'une liste",
      "fullDescription": "Comparer une ancienne et une nouvelle liste de données pour produire un ensemble minimal d'insertions/suppressions/déplacements à animer, via un algorithme de diff façon Myers ou un diff simplifié basé sur des hash d'identité et d'égalité de contenu.",
      "ios": "UITableView/UICollectionView DiffableDataSource calcule ce diff automatiquement à partir d'un snapshot, à condition que les éléments soient Hashable (et idéalement Identifiable) pour distinguer identité et changement de contenu.",
      "android": "ListAdapter combiné à DiffUtil.ItemCallback côté RecyclerView fait le même calcul, en distinguant areItemsTheSame (identité) et areContentsTheSame (égalité de contenu)."
    },
    {
      "id": "infinite-scroll",
      "name": "Infinite Scroll",
      "category": "ios-specifique",
      "summary": "Chargement progressif avec annulation des requêtes obsolètes",
      "fullDescription": "Charger davantage de données quand l'utilisateur approche de la fin d'une liste, en définissant un seuil de prefetch avant le dernier élément visible, en annulant les requêtes devenues obsolètes si l'utilisateur scrolle vite, et en garantissant que la réutilisation des cellules n'affiche jamais les données d'une ancienne requête en attente.",
      "ios": "UITableViewDataSourcePrefetching pour déclencher le chargement en avance, et annulation d'un URLSessionTask en cours dans prepareForReuse pour éviter qu'une réponse tardive n'écrase le contenu d'une cellule réutilisée.",
      "android": "Paging3 gère nativement le seuil de prefetch et l'invalidation ; en implémentation manuelle, un OnScrollListener déclenche le chargement et un Job de coroutine annulé dans onViewRecycled évite le même problème de réutilisation."
    },
    {
      "id": "image-cache",
      "name": "Image Cache",
      "category": "ios-specifique",
      "summary": "Cache mémoire + disque avec décodage hors thread principal",
      "fullDescription": "Cache à deux niveaux : un cache mémoire rapide (souvent LRU) pour l'accès immédiat, un cache disque persistant pour survivre aux redémarrages, avec une politique d'éviction basée sur la taille ou l'ancienneté, et un décodage d'image toujours effectué hors du thread principal pour ne pas bloquer l'interface.",
      "ios": "NSCache pour le niveau mémoire, un répertoire dans Caches/ pour le niveau disque, décodage via ImageIO sur une file de fond avant de repasser sur le thread principal pour l'affichage.",
      "android": "Glide ou Coil implémentent nativement ce cache à deux niveaux ; en version manuelle, LruCache pour la mémoire, le cache disque de OkHttp ou un répertoire dédié pour le disque, et décodage via BitmapFactory dans une coroutine sur Dispatchers.IO."
    },
    {
      "id": "flatten-tree",
      "name": "Flatten d'arbre imbriqué",
      "category": "ios-specifique",
      "summary": "Aplatir une structure arborescente en liste sectionnée/expandable",
      "fullDescription": "Transformer une structure arborescente (sections, sous-sections, éléments) en une liste plate à une dimension adaptée à un composant de liste, en conservant la profondeur et l'état d'expansion de chaque nœud, et en ré-aplatissant dynamiquement quand une section est repliée ou dépliée.",
      "ios": "Aplatir récursivement vers des sections/rows pour une UITableView, chaque ligne portant son niveau de profondeur et un identifiant de nœud pour gérer le repli au tap.",
      "android": "Même aplatissement récursif pour un RecyclerView, avec un ViewType différent par niveau et un état d'expansion conservé par identifiant de nœud."
    }
  ]
}
```

- [ ] **Step 3: Validate the JSON structure**

Run:
```bash
node -e "const d=JSON.parse(require('fs').readFileSync('algorithms.json','utf8')); if(d.algorithms.length!==17) throw new Error('expected 17 got '+d.algorithms.length); const fields=['id','name','category','summary','fullDescription','ios','android']; d.algorithms.forEach(a=>fields.forEach(k=>{if(!a[k]) throw new Error(a.id+' missing '+k)})); const ids=new Set(d.algorithms.map(a=>a.id)); if(ids.size!==17) throw new Error('duplicate id detected'); console.log('OK: 17 items, all fields present, ids unique')"
```
Expected: `OK: 17 items, all fields present, ids unique`

- [ ] **Step 4: Commit**

```bash
git add algorithms.json
git commit -m "Replace mood tracker data with interview algorithm wheel dataset"
```

---

## Task 2: HTML/CSS scaffold and static wheel rendering

**Files:**
- Create: `index.html`
- Create: `style.css`
- Create: `wheel.js`

**Interfaces:**
- Consumes: `algorithms.json` shape from Task 1 (`{ algorithms: [{ id, name, category, summary, fullDescription, ios, android }] }`).
- Produces DOM ids relied on by later tasks: `wheel-canvas`, `wheel-wrap`, `spin-btn`, `load-error`, `result-panel`, `result-name`, `result-description`, `result-ios`, `result-android`, `relaunch-btn`.
- Produces JS globals/functions relied on by Task 3 and Task 4: `TWO_PI`, `PALETTE`, `algorithms` (array, populated after load), `currentRotation` (number), `isSpinning` (boolean), `canvas`, `ctx`, `wheelWrap`, `spinButton`, `resultPanel`, `resultName`, `resultDescription`, `resultIos`, `resultAndroid`, `relaunchButton` (DOM refs), `drawWheel(rotation)`, `resizeCanvas()`, `truncateLabel(context, text, maxWidth)`, `showLoadError()`.

- [ ] **Step 1: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>La roue des algos d'entretien</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main class="page">
    <h1>🎡 La roue des algos d'entretien</h1>
    <p class="subtitle">Structures de données et algorithmes classiques en entretien, avec l'angle iOS et Android.</p>

    <div id="wheel-wrap" class="wheel-wrap">
      <canvas id="wheel-canvas"></canvas>
      <div class="pointer" aria-hidden="true"></div>
    </div>

    <button id="spin-btn" type="button">Lancer la roue</button>
    <p id="load-error" class="load-error" hidden>Impossible de charger la liste des algorithmes. Réessayez plus tard.</p>
  </main>

  <div id="result-panel" class="result-panel" hidden>
    <div class="result-card">
      <h2 id="result-name"></h2>
      <p id="result-description"></p>
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
    </div>
  </div>

  <script src="wheel.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `style.css`**

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

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  background: radial-gradient(circle at top, #2a1355, var(--bg));
  color: var(--text);
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.page {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;
  max-width: 600px;
}

h1 {
  margin: 0;
  font-size: clamp(1.5rem, 4vw, 2.25rem);
}

.subtitle {
  margin: 0;
  opacity: 0.8;
}

.wheel-wrap {
  position: relative;
  width: min(90vw, 500px);
  aspect-ratio: 1 / 1;
  margin: 1rem 0;
}

.wheel-wrap.pulse {
  animation: wheelPulse 0.5s ease-out;
}

@keyframes wheelPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.04); }
  100% { transform: scale(1); }
}

#wheel-canvas {
  display: block;
  border-radius: 50%;
  box-shadow: 0 10px 30px var(--shadow);
}

.pointer {
  position: absolute;
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 14px solid transparent;
  border-right: 14px solid transparent;
  border-top: 22px solid var(--accent);
  filter: drop-shadow(0 2px 3px var(--shadow));
}

#spin-btn {
  font-size: 1.1rem;
  font-weight: 700;
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 999px;
  background: var(--accent);
  color: #241247;
  cursor: pointer;
  transition: transform 0.15s ease, background 0.15s ease;
}

#spin-btn:hover:not(:disabled) {
  background: var(--accent-dark);
  transform: translateY(-1px);
}

#spin-btn:disabled {
  background: #5a5470;
  color: #9a93ac;
  cursor: not-allowed;
}

.load-error {
  color: #ff6b6b;
  font-weight: 600;
}

.result-panel {
  position: fixed;
  inset: 0;
  background: rgba(10, 4, 24, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 10;
}

.result-card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 1.5rem;
  max-width: 480px;
  width: 100%;
  box-shadow: 0 20px 50px var(--shadow);
  text-align: left;
}

.result-card h2 {
  margin-top: 0;
  color: var(--accent);
}

.result-platforms {
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
}

.platform-card {
  flex: 1;
  background: var(--bg-alt);
  border-radius: 12px;
  padding: 0.75rem 1rem;
}

.platform-card h3 {
  margin: 0 0 0.5rem;
  font-size: 0.95rem;
}

.platform-card p {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.9;
}

#relaunch-btn {
  width: 100%;
  font-size: 1rem;
  font-weight: 700;
  padding: 0.65rem;
  border: none;
  border-radius: 999px;
  background: var(--accent);
  color: #241247;
  cursor: pointer;
}

@media (max-width: 600px) {
  .result-platforms {
    flex-direction: column;
  }
}
```

- [ ] **Step 3: Create `wheel.js` with data loading, resize, and static drawing**

```javascript
'use strict';

const TWO_PI = Math.PI * 2;
const PALETTE = [
  '#e63946', '#f1a208', '#ffd60a', '#2a9d8f', '#457b9d',
  '#8338ec', '#ff006e', '#06d6a0', '#fb5607'
];

const canvas = document.getElementById('wheel-canvas');
const ctx = canvas.getContext('2d');
const wheelWrap = document.getElementById('wheel-wrap');
const spinButton = document.getElementById('spin-btn');
const loadError = document.getElementById('load-error');
const resultPanel = document.getElementById('result-panel');
const resultName = document.getElementById('result-name');
const resultDescription = document.getElementById('result-description');
const resultIos = document.getElementById('result-ios');
const resultAndroid = document.getElementById('result-android');
const relaunchButton = document.getElementById('relaunch-btn');

let algorithms = [];
let currentRotation = 0;
let isSpinning = false;

async function loadAlgorithms() {
  const response = await fetch('algorithms.json');
  if (!response.ok) {
    throw new Error(`Failed to load algorithms.json: ${response.status}`);
  }
  const data = await response.json();
  return data.algorithms;
}

function resizeCanvas() {
  const size = Math.max(260, Math.min(500, wheelWrap.clientWidth));
  const dpr = window.devicePixelRatio || 1;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function truncateLabel(context, text, maxWidth) {
  if (context.measureText(text).width <= maxWidth) {
    return text;
  }
  let truncated = text;
  while (truncated.length > 1 && context.measureText(`${truncated}…`).width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return `${truncated}…`;
}

function drawWheel(rotation) {
  const size = canvas.clientWidth;
  const radius = size / 2;
  ctx.clearRect(0, 0, size, size);
  if (!algorithms.length) {
    return;
  }
  ctx.save();
  ctx.translate(radius, radius);
  ctx.rotate(rotation);
  const sectorAngle = TWO_PI / algorithms.length;
  algorithms.forEach((algo, i) => {
    const startAngle = i * sectorAngle;
    const endAngle = startAngle + sectorAngle;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius - 4, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = PALETTE[i % PALETTE.length];
    ctx.fill();

    ctx.save();
    ctx.rotate(startAngle + sectorAngle / 2);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1a1a1a';
    ctx.font = '600 13px system-ui, sans-serif';
    const label = truncateLabel(ctx, algo.name, radius - 24);
    ctx.fillText(label, radius - 14, 0);
    ctx.restore();
  });
  ctx.restore();
}

function showLoadError() {
  loadError.hidden = false;
  spinButton.disabled = true;
}

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
}

init();
```

- [ ] **Step 4: Syntax-check the JS**

Run: `node --check wheel.js`
Expected: no output (exit code 0).

- [ ] **Step 5: Manually verify the static render**

Run: `python -m http.server 8000` in the repo root, then check:
```bash
curl -s http://localhost:8000/ | grep -c 'id="wheel-canvas"'
curl -s http://localhost:8000/algorithms.json | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); console.log(d.algorithms.length)"
```
Expected: first command prints `1`, second prints `17`. Then open `http://localhost:8000/` in a browser and confirm: a circular wheel with 17 distinct colored sectors renders, each with a readable (possibly truncated) label, a gold pointer sits at the top, the "Lancer la roue" button is visible (inert — clicking does nothing yet), and the browser console shows no errors. Stop the server (Ctrl+C) when done.

- [ ] **Step 6: Commit**

```bash
git add index.html style.css wheel.js
git commit -m "Add interview algorithm wheel page with static Canvas rendering"
```

---

## Task 3: Spin mechanic (rotation math, decelerating animation)

**Files:**
- Modify: `wheel.js` — append new functions after `drawWheel`, and modify `init()` to wire the click handler.

**Interfaces:**
- Consumes: `TWO_PI`, `algorithms`, `currentRotation`, `isSpinning`, `drawWheel(rotation)`, `spinButton`, `wheelWrap` from Task 2.
- Produces: `normalizeAngle(angle)`, `computeFinalRotation(fromRotation, winningIndex, sectorCount)`, `easeOutCubic(t)`, `animateSpin(fromRotation, toRotation, duration, onComplete)`, `triggerPulse()`, `handleSpinClick()` — relied on by Task 4, which will replace the `console.log` placeholder inside `handleSpinClick`'s completion callback with a call to `showResult(algorithm)`.

- [ ] **Step 1: Append the spin math and animation functions to `wheel.js`**

Insert directly after the `drawWheel` function (before `showLoadError`):

```javascript
const EXTRA_SPINS = 6;
const SPIN_DURATION_MS = 3000;

function normalizeAngle(angle) {
  return ((angle % TWO_PI) + TWO_PI) % TWO_PI;
}

function computeFinalRotation(fromRotation, winningIndex, sectorCount) {
  const sectorAngle = TWO_PI / sectorCount;
  const pointerAngle = -Math.PI / 2;
  const targetSectorCenter = (winningIndex + 0.5) * sectorAngle;
  const jitter = (Math.random() - 0.5) * sectorAngle * 0.6;
  const targetMod = normalizeAngle(pointerAngle - targetSectorCenter - jitter);
  const currentMod = normalizeAngle(fromRotation);
  let delta = targetMod - currentMod;
  if (delta < 0) {
    delta += TWO_PI;
  }
  return fromRotation + EXTRA_SPINS * TWO_PI + delta;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function animateSpin(fromRotation, toRotation, duration, onComplete) {
  const startTime = performance.now();
  function frame(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(t);
    currentRotation = fromRotation + (toRotation - fromRotation) * eased;
    drawWheel(currentRotation);
    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      currentRotation = toRotation;
      onComplete();
    }
  }
  requestAnimationFrame(frame);
}

function triggerPulse() {
  wheelWrap.classList.add('pulse');
  wheelWrap.addEventListener('animationend', () => {
    wheelWrap.classList.remove('pulse');
  }, { once: true });
}

function handleSpinClick() {
  if (isSpinning || !algorithms.length) {
    return;
  }
  isSpinning = true;
  spinButton.disabled = true;

  const winningIndex = Math.floor(Math.random() * algorithms.length);
  const fromRotation = currentRotation;
  const toRotation = computeFinalRotation(fromRotation, winningIndex, algorithms.length);

  animateSpin(fromRotation, toRotation, SPIN_DURATION_MS, () => {
    isSpinning = false;
    spinButton.disabled = false;
    triggerPulse();
    console.log('Winner:', algorithms[winningIndex].name);
  });
}
```

- [ ] **Step 2: Wire the click handler in `init()`**

In the existing `init()` function, add the listener registration right after the `window.addEventListener('resize', ...)` block:

```javascript
  window.addEventListener('resize', () => {
    resizeCanvas();
    drawWheel(currentRotation);
  });
  spinButton.addEventListener('click', handleSpinClick);
```

- [ ] **Step 3: Syntax-check the JS**

Run: `node --check wheel.js`
Expected: no output (exit code 0).

- [ ] **Step 4: Manually verify the spin**

Run: `python -m http.server 8000`, open `http://localhost:8000/` in a browser, open the console, then:
- Click "Lancer la roue". Confirm the button becomes disabled immediately, the wheel spins and visibly decelerates (fast at first, slowing to a stop) over roughly 3 seconds, a short pulse/scale effect plays when it stops, the button re-enables, and the console logs `Winner: <name>` matching the sector now under the top pointer.
- Click again 3-4 times in a row; confirm each spin independently completes in ~3s with a visible decel and a plausible winner (no frozen state, no runaway rotation values, no console errors).
Stop the server (Ctrl+C) when done.

- [ ] **Step 5: Commit**

```bash
git add wheel.js
git commit -m "Add decelerating spin animation and winner selection to the wheel"
```

---

## Task 4: Result panel and full game loop

**Files:**
- Modify: `wheel.js` — add `showResult`/`hideResultPanel`, replace the `console.log` placeholder, wire the relaunch button.

**Interfaces:**
- Consumes: `resultPanel`, `resultName`, `resultDescription`, `resultIos`, `resultAndroid`, `relaunchButton` (DOM refs from Task 2); `handleSpinClick` (from Task 3, modified in place here).
- Produces: `showResult(algorithm)`, `hideResultPanel()` — terminal functions, no later task depends on them beyond this point.

- [ ] **Step 1: Append `showResult` and `hideResultPanel` to `wheel.js`**

Insert directly after `handleSpinClick` (before `showLoadError`):

```javascript
function showResult(algorithm) {
  resultName.textContent = algorithm.name;
  resultDescription.textContent = algorithm.fullDescription;
  resultIos.textContent = algorithm.ios;
  resultAndroid.textContent = algorithm.android;
  resultPanel.hidden = false;
}

function hideResultPanel() {
  resultPanel.hidden = true;
}
```

- [ ] **Step 2: Replace the `console.log` placeholder in `handleSpinClick`**

Find this line inside `handleSpinClick`'s `animateSpin` completion callback:

```javascript
    console.log('Winner:', algorithms[winningIndex].name);
```

Replace it with:

```javascript
    showResult(algorithms[winningIndex]);
```

Also add `hideResultPanel();` at the top of `handleSpinClick`, right after the `spinButton.disabled = true;` line, so a new spin closes any panel left open from a previous result:

```javascript
  isSpinning = true;
  spinButton.disabled = true;
  hideResultPanel();
```

- [ ] **Step 3: Wire the relaunch button in `init()`**

In `init()`, add this line right after `spinButton.addEventListener('click', handleSpinClick);`:

```javascript
  relaunchButton.addEventListener('click', hideResultPanel);
```

- [ ] **Step 4: Syntax-check the JS**

Run: `node --check wheel.js`
Expected: no output (exit code 0).

- [ ] **Step 5: Manually verify the full loop**

Run: `python -m http.server 8000`, open `http://localhost:8000/`, then:
- Click "Lancer la roue" and wait for it to stop. Confirm the result panel appears with a title, a full description, and two side-by-side cards labeled "🍎 iOS" and "🤖 Android" with distinct, non-empty text — and that the title matches the sector under the pointer.
- Click "Relancer". Confirm the panel closes and the button is spin-ready again.
- Spin again immediately after closing the panel; confirm no leftover panel state and no console errors.
Stop the server (Ctrl+C) when done.

- [ ] **Step 6: Commit**

```bash
git add wheel.js
git commit -m "Show iOS/Android result panel after each spin"
```

---

## Task 5: Rewrite README.md and CLAUDE.md

**Files:**
- Modify: `README.md` (full rewrite)
- Modify: `CLAUDE.md` (full rewrite)

**Interfaces:**
- Consumes: final file structure and mechanics from Tasks 1-4 (no code interfaces — documentation only).

- [ ] **Step 1: Rewrite `README.md`**

Replace the entire contents of `README.md` with:

```markdown
# La roue des algos d'entretien 🎡

Un mini-jeu web : une roue de la fortune listant les structures de données
et algorithmes les plus souvent demandés en entretien technique, avec pour
chacun l'angle iOS (Swift) et l'équivalent Android (Kotlin).

## Fonctionnement

Cliquez sur « Lancer la roue ». Elle tourne pendant 3 secondes avec une
décélération progressive puis s'arrête sur un algorithme tiré au hasard
(le tirage se fait avec remise : un même algorithme peut ressortir
plusieurs fois de suite). Un panneau affiche alors son nom, une
description complète, et deux encarts détaillant l'implémentation
attendue côté iOS et côté Android.

## Ajouter ou modifier un algorithme

La liste des 17 algorithmes vit dans `algorithms.json`, à la racine du
repository. Chaque entrée suit ce schéma :

```json
{
  "id": "lru-cache",
  "name": "LRU Cache",
  "category": "structure",
  "summary": "Dictionnaire + liste doublement chaînée",
  "fullDescription": "Description complète affichée dans le panneau résultat.",
  "ios": "Détail spécifique à l'implémentation iOS/Swift.",
  "android": "Détail spécifique à l'implémentation Android/Kotlin."
}
```

- `category` est `"structure"`, `"algorithme"` ou `"ios-specifique"` — informatif uniquement, n'affecte ni la couleur ni le tirage.
- Pour ajouter un algorithme, ajoutez une entrée à la liste `algorithms` du fichier et rechargez la page : la roue s'adapte automatiquement au nombre d'entrées.
- Pour modifier un algorithme existant, éditez ses champs directement.

## Développement local

Aucune dépendance, aucune étape de build :

```bash
python -m http.server 8000
```

Puis ouvrez `http://localhost:8000/`.

## Technologie

- **HTML5 / CSS3** : structure et style de la page.
- **JavaScript vanilla** : chargement de `algorithms.json`, rendu de la roue en Canvas 2D, animation de rotation.
- **Canvas 2D API** : dessin des secteurs colorés et de leurs libellés.
- **Fetch API** : lecture de `algorithms.json`.

Pas de backend, pas de framework, pas de build — juste du HTML/CSS/JS pur, déployé automatiquement via GitHub Pages.
```

- [ ] **Step 2: Rewrite `CLAUDE.md`**

Replace the entire contents of `CLAUDE.md` with:

```markdown
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"La roue des algos d'entretien" — a spinning-wheel web game listing interview data structures and algorithms (originally scoped for iOS interviews), each paired with an iOS (Swift) and Android (Kotlin) implementation angle. Zero-dependency, static, hosted on GitHub Pages.

## Development

No build step, no package manager, no dependencies.

**Local development:**
```bash
python -m http.server 8000
```

**Deployment:** Automatic via GitHub Pages on push to main. No CI/CD pipeline.

**No tests or linting configured.** Verification is manual: `node --check wheel.js` for syntax, `node -e` scripts for validating `algorithms.json`, and browser checks against a local server.

## Architecture

- **`index.html`** — Page structure: the wheel canvas, spin button, and the result panel markup.
- **`style.css`** — Casino-style visual design, layout, and responsive rules (the iOS/Android result cards stack vertically below 600px).
- **`wheel.js`** — All game logic: fetches `algorithms.json`, draws the wheel on a `<canvas>` (Canvas 2D API), computes the winning rotation, animates the 3-second decelerating spin (`requestAnimationFrame` + `easeOutCubic`), and renders the result panel.
- **`algorithms.json`** — Data store for the 17 algorithms. Each entry: `id`, `name`, `category` (`structure` | `algorithme` | `ios-specifique`, informative only), `summary`, `fullDescription`, `ios`, `android`.

**Data flow:** Page load → fetch `algorithms.json` → draw the static wheel → user clicks "Lancer la roue" → uniform random pick (with replacement) → 3s decelerating rotation animation → result panel shows the winning algorithm's description and iOS/Android detail.

**Spin duration:** fixed at 3000ms, `easeOutCubic` easing for the deceleration effect.

## Content Language

The app UI, README, and algorithm descriptions are written in **French**. Technical API/framework names stay in their native English form (e.g. `DispatchWorkItem`, `LruCache`, `DiffUtil`).
```

- [ ] **Step 3: Verify old mood-tracker content is fully gone from docs**

Run:
```bash
grep -il "niko\|humeur\|mood" README.md CLAUDE.md
```
Expected: no output (grep finds nothing, exit code 1).

- [ ] **Step 4: Commit**

```bash
git add README.md CLAUDE.md
git commit -m "Rewrite README and CLAUDE.md for the interview algorithm wheel"
```

---

## Task 6: Final QA pass against the spec's verification checklist

**Files:** none (verification only — no code changes expected; fix forward in the relevant file from Tasks 1-5 if an issue is found).

**Interfaces:** none — this task exercises the finished app end-to-end.

- [ ] **Step 1: Run the full manual checklist from the spec**

Run: `python -m http.server 8000`, open `http://localhost:8000/` in a browser, and verify all of the following:

1. **Timing/alignment:** click "Lancer la roue" 5 times in a row (waiting for each to finish). Each spin takes ~3s, visibly decelerates, and the algorithm named in the result panel always matches the sector actually resting under the top pointer (no pointer/result mismatch).
2. **No accumulation bug:** after several consecutive spins, `currentRotation` keeps growing (check via console: `console.log(currentRotation)` after a spin) but the wheel never renders incorrectly or jumps — confirm visually there's no snapping/glitch at any spin start.
3. **Every sector reachable:** spin at least 10 times and confirm (via the result panel titles) that different algorithms come up, not just one or two repeating — consistent with uniform random selection.
4. **Responsive layout:** open browser devtools, toggle a mobile viewport (e.g. 375px wide). Confirm the wheel resizes to fit, the result panel's iOS/Android cards stack vertically (not side-by-side) below 600px width, and nothing overflows horizontally.
5. **Label legibility:** confirm all 17 sector labels are legible at the default desktop size (~500px wheel), truncated with `…` where the name doesn't fit rather than overflowing or overlapping the neighboring sector.
6. **Error path:** temporarily rename `algorithms.json` to `algorithms.json.bak`, refresh the page, confirm the error message ("Impossible de charger la liste des algorithmes...") appears and the spin button is disabled. Rename the file back to `algorithms.json` and refresh again to confirm normal operation resumes.

Stop the server (Ctrl+C) when done. If any check fails, fix the issue in the relevant file (`wheel.js`, `style.css`, or `index.html`) and re-run the specific failing check before proceeding.

- [ ] **Step 2: Confirm the old project is fully retired**

Run:
```bash
git ls-files | grep -i "mood"
```
Expected: no output (moods.json and any mood-related file are gone from version control).

- [ ] **Step 3: Final commit (only if Step 1 required fixes)**

If Step 1 required any code fix:
```bash
git add -A
git commit -m "Fix issues found in final QA pass"
```
If no fixes were needed, skip this step — Task 5's commit is already the final state.
