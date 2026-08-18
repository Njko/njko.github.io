# Exercices concrets + liens de doc/pratique — Design Spec

**Status:** Approved by user, ready for planning
**Date:** 2026-08-18

## Goal

Rendre "La roue des algos" concrètement exploitable pour s'entraîner : chaque
algorithme gagne (1) trois exercices progressifs (facile/moyen/difficile) avec
énoncé, signature Swift + Kotlin, exemples input/output, et solution
non-optimisée masquée derrière un bouton ; (2) un lien de documentation
approfondie et, quand pertinent, un lien vers un site de pratique externe
(LeetCode ou équivalent).

## Non-goals

- Pas d'exécution/compilation réelle du code (site statique, zéro dépendance
  — les tests affichés sont illustratifs, pas exécutables).
- Pas de suivi de progression utilisateur (pas de "exercice complété"), pas
  de compte, pas de stockage local.
- Pas de refonte de la roue elle-même (canvas, animation de spin) : seul le
  panneau de résultat évolue.

## Data schema

Chaque entrée de `algorithms.json` garde tous ses champs actuels
(`id`, `name`, `category`, `summary`, `fullDescription`, `ios`, `android`,
`keywords`) et gagne :

```json
{
  "docUrl": "https://...",
  "practiceUrl": "https://...",
  "exercises": [
    {
      "level": "facile",
      "title": "...",
      "statement": "...",
      "swift": { "signature": "...", "solution": "..." },
      "kotlin": { "signature": "...", "solution": "..." },
      "tests": [
        { "input": "...", "output": "..." },
        { "input": "...", "output": "..." }
      ]
    },
    { "level": "moyen", "...": "..." },
    { "level": "difficile", "...": "..." }
  ]
}
```

Règles :
- `docUrl` : toujours présent, string non vide, URL vérifiée (résout en
  200) au moment de l'écriture du contenu.
- `practiceUrl` : optionnel — **absent** (clé omise, pas `null`) quand aucun
  site de pratique pertinent n'a été trouvé (ex : concepts très
  iOS/Android-spécifiques comme le diffing de listes).
- `exercises` : toujours exactement 3 éléments, dans l'ordre
  `facile`, `moyen`, `difficile`.
- Chaque exercice a exactement les champs `level`, `title`, `statement`,
  `swift` (`signature`, `solution`), `kotlin` (`signature`, `solution`),
  `tests` (tableau de 2 objets `input`/`output`, tous en string — même les
  valeurs numériques, pour un rendu uniforme).
- Les solutions peuvent être non-optimisées (complexité naïve acceptée) :
  la progression de difficulté vient de la portée fonctionnelle demandée par
  l'énoncé, pas de la complexité algorithmique exigée de la solution.

## Worked example — LRU Cache (gabarit de référence)

Ceci est l'entrée complète attendue pour `lru-cache`, à utiliser comme
gabarit de structure ET de niveau de qualité pour les 16 autres algorithmes.

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
}
```

## Doc/practice link research (17 algorithmes)

Table de départ pour les 16 algorithmes restants (LRU Cache déjà traité
ci-dessus). Statut `vérifié` = confirmé accessible pendant le brainstorming ;
`à vérifier` = candidat de haute confiance (page canonique bien connue) mais
non testé — chaque tâche de contenu DOIT re-vérifier avec WebFetch (ou
WebSearch si WebFetch échoue, ex: LeetCode bloque WebFetch avec un 403 —
dans ce cas s'appuyer sur WebSearch pour confirmer que le problème existe)
avant de committer le lien. Si un lien candidat s'avère mort, en trouver un
autre plutôt que de laisser un lien invalide.

| id | docUrl candidat | statut | practiceUrl candidat | statut |
|---|---|---|---|---|
| queue-fifo | https://en.wikipedia.org/wiki/Queue_(abstract_data_type) | à vérifier | https://leetcode.com/problems/design-circular-queue/ | à vérifier (WebSearch) |
| ring-buffer | https://en.wikipedia.org/wiki/Circular_buffer | à vérifier | https://leetcode.com/problems/moving-average-from-data-stream/ | à vérifier (WebSearch) |
| stack | https://en.wikipedia.org/wiki/Stack_(abstract_data_type) | à vérifier | https://leetcode.com/problems/min-stack/ | à vérifier (WebSearch) |
| linked-list | https://en.wikipedia.org/wiki/Linked_list | à vérifier | https://leetcode.com/problems/linked-list-cycle/ | à vérifier (WebSearch) |
| debounce-throttle | https://css-tricks.com/debouncing-throttling-explained-examples/ | **vérifié** | *(aucun candidat fiable trouvé — chercher sur bigfrontend.dev / greatfrontend.com pendant la tâche, sinon omettre)* | à rechercher |
| thread-safe-counter | https://en.wikipedia.org/wiki/Race_condition | à vérifier | https://leetcode.com/problems/print-in-order/ | à vérifier (WebSearch) |
| two-pointers | https://www.geeksforgeeks.org/dsa/two-pointers-technique/ | **vérifié** | https://leetcode.com/problems/longest-substring-without-repeating-characters/ | à vérifier (WebSearch) |
| binary-search | https://en.wikipedia.org/wiki/Binary_search_algorithm | à vérifier | https://leetcode.com/problems/search-insert-position/ | à vérifier (WebSearch) |
| bfs-dfs-tree | https://en.wikipedia.org/wiki/Tree_traversal | à vérifier | https://leetcode.com/problems/binary-tree-level-order-traversal/ | à vérifier (WebSearch) |
| topological-sort | https://en.wikipedia.org/wiki/Topological_sorting | à vérifier | https://leetcode.com/problems/course-schedule/ | à vérifier (WebSearch) |
| merge-intervals | https://www.geeksforgeeks.org/dsa/merging-intervals/ | **vérifié** | https://leetcode.com/problems/merge-intervals/ | à vérifier (WebSearch) |
| anagram-frequency | https://en.wikipedia.org/wiki/Anagram | à vérifier | https://leetcode.com/problems/group-anagrams/ | à vérifier (WebSearch) |
| list-diffing | https://en.wikipedia.org/wiki/Diff#Algorithms | à vérifier | *(pas d'équivalent LeetCode direct — omettre practiceUrl sauf si la tâche en trouve un pertinent)* | omis par défaut |
| infinite-scroll | https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API | à vérifier | *(pas d'équivalent LeetCode direct — chercher sur greatfrontend.com pendant la tâche, sinon omettre)* | à rechercher |
| image-cache | https://en.wikipedia.org/wiki/Cache_(computing) | à vérifier | https://leetcode.com/problems/lru-cache/ (réutilisation assumée : image cache = LRU appliqué à des images) | à vérifier (WebSearch) |
| flatten-tree | https://en.wikipedia.org/wiki/Tree_(data_structure) | à vérifier | https://leetcode.com/problems/flatten-binary-tree-to-linked-list/ | à vérifier (WebSearch) |

## UI / DOM structure

Dans `index.html`, à l'intérieur de `.result-card`, entre `.result-platforms`
et `#relaunch-btn` :

```html
<div id="result-links" class="result-links">
  <a id="result-doc-link" class="result-link" href="#" target="_blank" rel="noopener">📖 Doc approfondie</a>
  <a id="result-practice-link" class="result-link" href="#" target="_blank" rel="noopener">💻 S'entraîner</a>
</div>
<div id="result-exercises" class="result-exercises"></div>
```

`#result-doc-link` / `#result-practice-link` : `hidden` ajouté/retiré selon
la présence du champ correspondant sur l'algo affiché. `#result-exercises`
est repeuplé à chaque appel de `showResult()`.

Structure générée par exercice (un `<details>` par niveau, dans l'ordre
facile/moyen/difficile) :

```html
<details class="exercise" data-level="facile">
  <summary>Facile — {title}</summary>
  <div class="exercise-body">
    <p class="exercise-statement">{statement}</p>
    <div class="lang-tabs">
      <button type="button" class="lang-tab active" data-lang="swift">Swift</button>
      <button type="button" class="lang-tab" data-lang="kotlin">Kotlin</button>
    </div>
    <div class="lang-panel" data-lang="swift">
      <pre class="code-block signature"><code>{swift.signature}</code></pre>
      <pre class="code-block solution" hidden><code>{swift.solution}</code></pre>
    </div>
    <div class="lang-panel" data-lang="kotlin" hidden>
      <pre class="code-block signature"><code>{kotlin.signature}</code></pre>
      <pre class="code-block solution" hidden><code>{kotlin.solution}</code></pre>
    </div>
    <div class="exercise-tests">
      <p class="exercise-test"><code>{test[0].input}</code> → <code>{test[0].output}</code></p>
      <p class="exercise-test"><code>{test[1].input}</code> → <code>{test[1].output}</code></p>
    </div>
    <button type="button" class="reveal-btn">Révéler la solution</button>
  </div>
</details>
```

Tout est construit via `document.createElement` + `textContent`
(jamais `innerHTML`), pour rester cohérent avec le style déjà utilisé
partout ailleurs dans `wheel.js` (pas d'injection depuis les données JSON).

### Comportement JS

- **Onglets Swift/Kotlin** : un seul écouteur `click` délégué sur
  `#result-exercises` (posé une fois dans `init()`, jamais réattaché).
  Sur clic d'un `.lang-tab` : basculer `active` entre les deux boutons du
  même `.exercise`, et basculer l'attribut `hidden` sur les deux
  `.lang-panel` du même `.exercise` en fonction de `data-lang`.
- **Révéler la solution** : sur clic d'un `.reveal-btn` (délégué sur le même
  écouteur), retirer l'attribut `hidden` des deux `pre.solution` du même
  `.exercise` (les deux langues sont révélées en mémoire, mais seule celle
  du `.lang-panel` actif est visible — changer d'onglet après révélation
  garde la solution visible). Le texte du bouton bascule entre
  "Révéler la solution" / "Masquer la solution" (deuxième clic re-masque).
- **Accordéon** : géré nativement par `<details>`/`<summary>`, aucun JS —
  chaque exercice se déplie/replie indépendamment des deux autres.
- Le panneau garde son comportement `hidden` global inchangé ; le texte du
  bouton "Relancer"/"Fermer" existant n'est pas affecté par ce changement.

### CSS

Nouvelles règles dans `style.css`, dans le même esprit visuel que
`.platform-card` existant (cartes arrondies, palette du site) :
- `.result-links` : rangée de deux liens type "pill" avec icône, wrap sur
  mobile.
- `.exercise` (le `<details>`) : carte avec bordure arrondie, `summary`
  cliquable avec indicateur d'expansion (chevron via `list-style` ou
  `::marker` custom), une teinte de couleur légèrement différente par
  niveau (facile = vert, moyen = orange, difficile = rouge) sur la bordure
  gauche ou le texte du niveau, cohérent avec la palette existante du site.
- `.lang-tabs` / `.lang-tab` : petits boutons pill, `.active` en couleur
  pleine, cohérent avec `.keyword-pill` existant.
- `.code-block` : `font-family: monospace`, `white-space: pre-wrap`,
  `overflow-x: auto` (jamais de débordement horizontal de la page, cf.
  contrainte responsive), fond légèrement distinct du reste de la carte.
- Pas de nouveau breakpoint nécessaire : `.exercise-body` reste en colonne
  unique à toutes les tailles (contrairement aux `platform-card` qui
  passent de côte-à-côte à empilé à 600px) — le contenu d'un exercice est
  déjà linéaire par construction.

## Validation

Un script `node -e` (documenté dans `CLAUDE.md` aux côtés de la commande
existante) doit vérifier, pour chaque algorithme de `algorithms.json` :
- `docUrl` est une string non vide.
- `practiceUrl`, si présent, est une string non vide.
- `exercises` est un tableau de longueur exactement 3.
- Les `level` des 3 exercices sont, dans l'ordre, `"facile"`, `"moyen"`,
  `"difficile"`.
- Chaque exercice a `title`, `statement` (strings non vides), `swift.signature`,
  `swift.solution`, `kotlin.signature`, `kotlin.solution` (strings non
  vides), et `tests` (tableau de longueur exactement 2, chaque élément
  ayant `input` et `output` en strings non vides).

`node --check wheel.js` reste la vérification de syntaxe JS existante,
inchangée.

## Content authoring process (pour le plan d'implémentation)

1. Tâches d'infrastructure d'abord (schéma/HTML/CSS/JS de rendu +
   validation), écrites en détail complet dans le plan.
2. Une tâche "contenu LRU Cache" qui se contente de copier-coller le JSON
   du gabarit ci-dessus dans `algorithms.json` et de vérifier les 2 liens
   (déjà vérifiés ci-dessus, donc tâche rapide) — sert de vérification que
   le pipeline (rendu + validation) fonctionne avec de vraies données avant
   de lancer les 16 tâches de contenu restantes.
3. Seize tâches "contenu {algo}", une par algorithme restant, exécutables
   en parallèle par des sous-agents (subagent-driven-development). Chaque
   tâche reçoit : les champs existants de l'algo (summary/fullDescription/
   ios/android/keywords), le gabarit LRU Cache complet comme référence de
   structure et de qualité, et les candidats de liens du tableau ci-dessus
   à vérifier (WebFetch, ou WebSearch si WebFetch échoue) avant de les
   committer — remplacer par un autre lien fiable si le candidat est mort
   ou non pertinent après vérification.
4. Une tâche finale de vérification manuelle au navigateur (voir
   `CLAUDE.md` : `python -m http.server`) sur 2-3 algorithmes représentatifs
   (un avec practiceUrl, un sans) pour confirmer le rendu visuel et
   l'interaction (onglets, reveal, accordéon) avant de considérer la
   fonctionnalité terminée.

## Testing strategy

Pas de framework de test dans ce projet (cf. `CLAUDE.md`). Vérification :
- `node --check wheel.js` après chaque modification de `wheel.js`.
- Script de validation `node -e` ci-dessus après chaque ajout de contenu à
  `algorithms.json`, exécuté une fois à la fin de toutes les tâches de
  contenu (pas besoin de le relancer après chaque algo individuellement,
  mais utile pour un check rapide si une tâche de contenu semble incomplète).
- Contrôle visuel navigateur (`python -m http.server 8000`) pour la tâche
  finale d'intégration : vérifier l'accordéon, le bascule Swift/Kotlin, le
  bouton de révélation, l'affichage/masquage conditionnel des liens doc/
  practice, et l'absence de débordement horizontal sur mobile (< 600px,
  utiliser les devtools responsive).
