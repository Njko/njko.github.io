# Roue des algorithmes d'entretien — Design

Date : 2026-08-17

## Contexte et objectif

Le repository `njko.github.io` hébergeait un tracker d'humeur (« Mon Niko
Niko »). Ce projet a été déplacé/nettoyé ailleurs ; ce repo est réutilisé
intégralement pour un nouveau mini-jeu web : une roue de la fortune listant
les structures de données et algorithmes le plus souvent demandés en
entretien technique (initialement pensés côté iOS/Swift), avec un
équivalent Android/Kotlin pour chaque item. Les participants cliquent sur
un bouton, la roue tourne 3 secondes avec une décélération, puis affiche
le résultat tiré avec le détail iOS et Android.

L'ancien contenu (`index.html`, `moods.json`) est entièrement remplacé —
aucune contrainte de rétrocompatibilité ni de conservation des données.

## Périmètre

- Une page web statique, zero-dependency, servie par GitHub Pages.
- Une roue à ~17 secteurs, tirage aléatoire uniforme **avec remise**
  (un item peut ressortir plusieurs fois de suite).
- Un seul mode : clic sur « Lancer » → 3s d'animation → panneau résultat.
- Pas de gestion de joueurs/tours, pas de persistance d'historique, pas de
  backend.
- Support desktop en priorité, responsive mobile en second (encarts iOS/
  Android empilés verticalement sous une certaine largeur d'écran).

Hors périmètre (explicitement écarté) : comptes/joueurs, historique des
tirages, tirage sans remise, sons, mode hors-ligne/PWA.

## Structure de fichiers

```
index.html          # structure de la page (nouveau contenu, remplace l'ancien)
style.css            # styles de la roue, du panneau résultat, responsive
wheel.js             # logique : chargement des données, dessin canvas, animation, résultat
algorithms.json       # données des ~17 algorithmes (remplace moods.json)
README.md            # réécrit pour décrire le nouveau projet
CLAUDE.md             # mis à jour : architecture, conventions, commandes
```

`moods.json` et le contenu actuel d'`index.html` sont supprimés du
working tree (récupérables via l'historique git si besoin un jour, mais
ce n'est pas un objectif du projet).

## Modèle de données (`algorithms.json`)

```json
{
  "algorithms": [
    {
      "id": "lru-cache",
      "name": "LRU Cache",
      "category": "structure",
      "summary": "Dictionnaire + liste doublement chaînée",
      "fullDescription": "Cache à éviction LRU : combine une hash map pour l'accès O(1) et une liste doublement chaînée pour réordonner/évincer en O(1). Le cas le plus demandé car il correspond directement à NSCache et aux caches d'images.",
      "ios": "NSCache s'en inspire ; on l'implémente à la main pour gérer une politique d'éviction custom (ex: cache d'images avec capacité mémoire).",
      "android": "LruCache<K,V> du SDK Android fait exactement ça nativement ; Glide/Coil s'appuient dessus pour leur cache mémoire."
    }
  ]
}
```

Champs : `id` (slug unique), `name` (affiché dans le secteur et le
panneau), `category` (`structure` | `algorithme` | `ios-specifique`, métadonnée
informative uniquement — ni filtrage ni coloration par catégorie dans le
scope V1, les couleurs de secteurs suivent uniquement la palette
cyclique décrite plus bas),
`summary` (accroche courte, éventuellement tronquée dans le secteur),
`fullDescription`, `ios`, `android`. Tous les items ont systématiquement
les deux champs `ios` et `android`, y compris les algorithmes génériques
(reframés côté plateforme quand ce n'est pas un vrai sujet distinct).

### Liste des 17 items

**Structures (7)**
1. Queue (FIFO) — buffer circulaire / liste chaînée
2. LRU Cache — dictionnaire + liste doublement chaînée
3. Ring / Circular buffer — audio, télémétrie
4. Stack — implémentation par array, question COW
5. Generic Linked List — ARC / retain cycles, weak back-pointer
6. Debounce / Throttle — implémentation manuelle avec annulation
7. Thread-safe Dictionary / Counter — verrous vs actor vs structures concurrentes

**Algorithmes classiques (6)**
8. Two pointers / Sliding window — plus longue sous-chaîne sans répétition
9. Binary search — index d'insertion dans une liste paginée triée
10. BFS/DFS sur un arbre — parcours de hiérarchie de vues / arbre JSON
11. Topological sort — dépendances entre opérations/tâches
12. Merge intervals — fusion d'événements de calendrier
13. Anagram / Frequency counting — comptage par dictionnaire

**Spécifiques UI (4)**
14. Diffing de listes — mise à jour de UITableView/UICollectionView (Myers/hash diff)
15. Infinite scroll — seuil de prefetch, annulation des requêtes en vol, réutilisation de cellules
16. Image cache — deux niveaux mémoire/disque, éviction, décodage hors thread principal
17. Flatten d'arbre imbriqué — liste sectionnée/expandable

Pour chacun, `ios` / `android` couvrent respectivement les APIs/patterns
Swift (DispatchWorkItem, actor, NSOperationQueue, DiffableDataSource,
EventKit, UITableViewDataSourcePrefetching...) et leurs équivalents Kotlin
(Coroutines + Job, Mutex/synchronized, WorkManager, ListAdapter+DiffUtil,
CalendarContract, Paging3...). Le contenu texte complet de chaque entrée
est rédigé au moment de l'implémentation, pas dans ce document.

## Rendu de la roue (Canvas 2D)

- Un `<canvas>` carré, redimensionné en JS selon la largeur du viewport
  (`ResizeObserver` ou recalcul au `resize`).
- Chaque secteur = `2π / 17` radians, dessiné avec `arc()` + couleur issue
  d'une palette cyclique de 8-10 teintes contrastées (répétée pour
  couvrir les 17 secteurs, teintes adjacentes jamais identiques).
- Le nom de l'algo est dessiné le long du rayon de chaque secteur
  (`ctx.rotate` + `ctx.fillText`), tronqué avec `…` si trop long pour la
  largeur du secteur.
- Un pointeur fixe (triangle CSS ou dessiné sur un canvas superposé) en
  haut du cercle indique le secteur gagnant.
- Bouton « Lancer » au centre ou sous la roue.

## Mécanique de tirage et d'animation

1. Clic sur « Lancer » → bouton désactivé, tirage d'un index gagnant par
   `Math.random()` uniforme sur les 17 items (tirage avec remise, aucun
   état à exclure).
2. Calcul de la rotation finale : angle actuel + N tours complets
   (N fixe, ex. 6) + offset pour amener le centre du secteur gagnant sous
   le pointeur fixe, plus une petite variation aléatoire à l'intérieur du
   secteur pour un effet naturel.
3. Animation sur 3000ms via `requestAnimationFrame`, progression `t`
   normalisée [0,1] passée dans un easing `easeOutCubic` (`1 - (1-t)^3`)
   appliqué à l'angle de rotation du canvas — donne l'effet de
   décélération demandé sans dépendance externe.
4. À la fin de l'animation : léger effet visuel sur le secteur gagnant
   (flash/pulse), bouton réactivé, ouverture du panneau résultat.

## Panneau résultat

Carte/modal affichée après l'arrêt de la roue :
- Titre : nom de l'algorithme.
- `fullDescription`.
- Deux encarts côte à côte, 🍎 iOS et 🤖 Android, avec le texte
  spécifique à chaque plateforme. En dessous d'un breakpoint mobile
  (ex: 600px), les encarts s'empilent verticalement.
- Bouton « Relancer » qui ferme le panneau et remet la roue prête à
  tourner (aucun état à réinitialiser puisque le tirage est avec remise).

## Gestion des erreurs

- Si `algorithms.json` ne charge pas (fetch échoue), afficher un message
  d'erreur simple à la place de la roue plutôt qu'un canvas vide muet.
- Pas d'autre cas d'erreur significatif (pas de backend, pas d'input
  utilisateur autre que le clic).

## Mise à jour de la documentation

- `README.md` réécrit : présentation du jeu, règles (tirage avec remise),
  comment ajouter/modifier un algorithme dans `algorithms.json`, stack
  technique (HTML/CSS/JS vanilla, Canvas 2D, zero dependency).
- `CLAUDE.md` mis à jour : nouvel aperçu du projet, nouvelle architecture
  de fichiers, suppression des sections spécifiques au tracker d'humeur
  (mood scale, convention de commit `🎭 Humeur du...`).

## Tests / vérification

Pas de framework de test dans ce repo (cohérent avec l'existant). Vérification manuelle avant de considérer la V1 terminée :
- Servir en local (`python -m http.server`) et vérifier au clic : la
  roue tourne exactement ~3s, décélère visiblement, s'arrête sur un
  secteur cohérent avec le panneau affiché (pas de décalage
  pointeur/résultat).
- Vérifier plusieurs tirages successifs (pas de bug d'accumulation
  d'angle, pas de secteur qui ne peut jamais sortir).
- Vérifier le rendu responsive (redimensionnement fenêtre, viewport
  mobile via devtools) : canvas et panneau résultat restent lisibles.
- Vérifier que les 17 noms de secteurs restent lisibles à la taille du
  canvas par défaut (troncature correcte si besoin).

## Points ouverts pour l'implémentation (non bloquants pour ce spec)

Aucun — le contenu textuel complet de chaque entrée `algorithms.json`
(descriptions, angles iOS/Android) sera rédigé pendant l'implémentation,
mais le schéma et la liste des 17 items sont figés ci-dessus.
