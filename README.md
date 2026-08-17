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
