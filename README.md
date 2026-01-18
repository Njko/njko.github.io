# Mon Niko Niko 📊

Application web simple pour afficher votre humeur du jour, inspirée du calendrier Niko Niko utilisé dans les équipes agiles.

## Qu'est-ce qu'un Niko Niko ?

Le Niko Niko (ニコニコ signifiant "sourire" en japonais) est un outil de visualisation d'humeur permettant de suivre votre état émotionnel au fil du temps.

## Fonctionnement

Cette application affiche votre humeur du jour en lisant le fichier `moods.json`.

### Affichage

- 🎭 Grande visualisation de l'humeur du jour
- 📊 Statistiques simples (nombre de jours, moyenne)
- 🎨 Design épuré et animé

### Mise à jour des humeurs

Les humeurs sont enregistrées dans le fichier `moods.json` à la racine du repository. Pour ajouter ou modifier une humeur, éditez simplement ce fichier et commitez les changements via Git.

## Format du fichier moods.json

```json
{
  "moods": {
    "2026-01-17": {
      "value": "1",
      "reason": "💻"
    },
    "2026-01-18": {
      "value": "2",
      "reason": "🏠"
    }
  }
}
```

### Structure des entrées

Chaque entrée contient :
- **`value`** (1-5) : Le niveau d'humeur (l'emoji d'humeur est automatiquement mappé depuis cette valeur)
- **`reason`** (optionnel) : Un emoji représentant la raison/contexte de cette humeur (ex: 💻 travail, 🏠 maison, 👨‍👩‍👧‍👦 famille, etc.)

### Les 5 niveaux d'humeur

- **5** : 😄 Excellent - Une excellente journée !
- **4** : 🙂 Bien - Bonne humeur générale
- **3** : 😐 Neutre - Journée normale
- **2** : 😕 Moyen - Quelques difficultés
- **1** : 😢 Difficile - Journée difficile

### Exemples d'emojis de raison

- 💻 Travail
- 🏠 Maison
- 👨‍👩‍👧‍👦 Famille
- 🏃 Sport/Santé
- 💰 Finances
- ✈️ Voyage
- 🎉 Événement spécial
- 😴 Fatigue
- etc.

## Workflow Git

Pour mettre à jour votre humeur du jour :

1. Éditez le fichier `moods.json`
2. Ajoutez ou modifiez l'entrée pour la date du jour (format: `AAAA-MM-JJ`)
3. Commitez le changement : `git commit -m "🎭 Humeur du JJ/MM : [emoji]"`
4. Pushez vers GitHub : `git push`
5. Rafraîchissez la page web pour voir la mise à jour

## Exemple de commit

```bash
# Éditer moods.json pour ajouter l'humeur du jour
# Exemple : value: 2 (Moyen 😕), reason: 🏠 (maison)
git add moods.json
git commit -m "🎭 Humeur du 18/01 : 😕 (🏠)"
git push
```

## Technologie

Application web simple utilisant :
- **HTML5** : Structure de la page
- **CSS3** : Design moderne avec animations
- **JavaScript vanilla** : Chargement et affichage du JSON
- **Fetch API** : Lecture du fichier moods.json

Pas de backend, pas de configuration compliquée - juste un fichier JSON et du HTML/CSS/JS pur !

---

Prenez soin de vous et suivez votre bien-être au quotidien ! 🌟
