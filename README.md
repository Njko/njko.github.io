# Mon Niko Niko 📊

Application web de suivi d'humeur quotidienne inspirée du calendrier Niko Niko utilisé dans les équipes agiles, avec **synchronisation Git**.

## Qu'est-ce qu'un Niko Niko ?

Le Niko Niko (ニコニコ signifiant "sourire" en japonais) est un outil de visualisation d'humeur permettant de suivre votre état émotionnel au fil du temps.

## Fonctionnalités

- 😄 **Enregistrement quotidien** : Sélectionnez votre humeur parmi 5 niveaux
- 📅 **Historique visuel** : Visualisez vos humeurs passées dans un calendrier
- 📊 **Statistiques** : Consultez vos tendances d'humeur
  - Nombre de jours enregistrés
  - Humeur la plus fréquente
  - Moyenne générale
- 🔄 **Synchronisation Git** : Vos données sont sauvegardées via Git et accessibles depuis tous vos navigateurs
- 💾 **Sauvegarde automatique** : Chaque humeur enregistrée crée un commit Git automatique
- 🔒 **Fallback local** : Sauvegarde locale en cas de problème de connexion

## Utilisation

### Première configuration

1. Visitez [njko.github.io](https://njko.github.io)
2. Cliquez sur **⚙️ Configuration** en haut à droite
3. Créez un **Personal Access Token** GitHub :
   - Visitez [github.com/settings/tokens/new](https://github.com/settings/tokens/new)
   - Donnez un nom au token (ex: "Niko Niko")
   - Cochez la permission **repo** (Full control of private repositories)
   - Cliquez sur "Generate token" et **copiez le token** (vous ne le verrez qu'une fois !)
4. Remplissez le formulaire de configuration :
   - **Propriétaire** : votre username GitHub
   - **Repository** : le nom de votre repo (ex: `username.github.io`)
   - **Branche** : `main` ou `master` (selon votre configuration)
   - **Token** : collez le token créé à l'étape 3
5. Cliquez sur **Enregistrer**

### Enregistrer votre humeur

1. Sélectionnez votre humeur du jour en cliquant sur un emoji
2. Cliquez sur **Enregistrer mon humeur**
3. L'application crée automatiquement un commit Git avec votre humeur
4. Votre historique et statistiques se mettent à jour automatiquement

### Utilisation multi-navigateurs

Vos données sont synchronisées via Git ! Configurez simplement l'application avec le même token GitHub sur chaque navigateur pour accéder à votre historique complet.

## Les 5 niveaux d'humeur

- 😄 **Excellent** : Une excellente journée !
- 🙂 **Bien** : Bonne humeur générale
- 😐 **Neutre** : Journée normale, ni bonne ni mauvaise
- 😕 **Moyen** : Quelques difficultés
- 😢 **Difficile** : Journée difficile

## Technologie

Application web utilisant :
- **HTML5** : Structure de la page
- **CSS3** : Design moderne avec gradients et animations
- **JavaScript vanilla** : Logique applicative orientée objet
- **GitHub API** : Synchronisation des données via commits automatiques
- **LocalStorage** : Sauvegarde locale et fallback en cas d'erreur

## Architecture des données

Les données sont stockées dans le fichier `moods.json` à la racine du repository :

```json
{
  "moods": {
    "2026-01-18": {
      "value": "5",
      "emoji": "😄"
    },
    "2026-01-19": {
      "value": "4",
      "emoji": "🙂"
    }
  }
}
```

Chaque enregistrement crée un commit avec le message :
```
🎭 Humeur du 18/01/2026 : 😄
```

## Sécurité

- Le **Personal Access Token** est stocké uniquement dans le localStorage de votre navigateur
- Les données ne transitent jamais par un serveur tiers
- Communication directe avec l'API GitHub en HTTPS
- En cas de perte du token, générez-en simplement un nouveau

## FAQ

**Q: Que se passe-t-il si je perds mon token ?**
R: Générez un nouveau token et reconfigurez l'application. Vos données restent dans le repository Git.

**Q: Puis-je modifier mes humeurs passées ?**
R: Vous pouvez éditer manuellement le fichier `moods.json` dans votre repository Git.

**Q: L'application fonctionne-t-elle hors ligne ?**
R: L'application charge les données au démarrage. En cas de problème, elle utilise le cache local.

**Q: Puis-je utiliser un repository privé ?**
R: Oui ! Le token avec permission `repo` fonctionne aussi pour les repositories privés.

---

Prenez soin de vous et suivez votre bien-être au quotidien ! 🌟
