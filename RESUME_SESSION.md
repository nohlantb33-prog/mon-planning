# Résumé — Projet "Mon Planning" (mis à jour le 2026-10-05)

## Contexte général
Nohlan (lycéen) construit avec Claude Code un site de planning **100 % statique** (HTML/CSS/JS pur, pas de framework ni de serveur ; seule dépendance externe : pdf.js via CDN pour l'import PDF). Il est en train d'apprendre : expliquer simplement, étape par étape, en français. Toutes les données sont dans le `localStorage` du navigateur (rien n'est envoyé à un serveur).

- **Dossier :** `C:\Users\nohla\Desktop\mon-site` — fichiers : `index.html`, `style.css`, `script.js`, `manifest.json`, `sw.js`, `icons/`
- **Dépôt GitHub :** https://github.com/nohlantb33-prog/mon-planning (branche `main`)
- **Site en ligne (Netlify, URL non référencée, protégée par connexion) :** https://splendorous-douhua-9e49e6.netlify.app — se redéploie automatiquement à chaque push sur `main`
- **Installable comme une app** (PWA : manifest + service worker + icônes). Testé installé sur le téléphone de Nohlan.

## ⚠️ État Git : 6 commits PAS ENCORE poussés
Les commits ci-dessous existent seulement sur le PC. Pour les mettre en ligne (et sur le téléphone), Nohlan lance **dans son propre terminal PowerShell** (l'outil de Claude n'a pas internet ni de TTY pour la connexion GitHub) :
```
git push
```
Commits en attente (du plus ancien au plus récent) :
1. `2f11674` Texte des activités lisible sur les couleurs claires (jaune…)
2. `22be01a` Jours de travail colorés dans la vue Semaine (Famille)
3. `dd877dc` Jours de travail colorés aussi dans la vue Jour (Famille)
4. `842cb23` Planning mensuel qui s'arrête à la fin de la dernière semaine du mois
5. `9870f4b` 4 nouveaux thèmes sombres colorés (Forêt, Améthyste, Braise, Rose nuit)
6. `5d294c6` Couleurs d'activités adaptées au thème choisi
(+ quelques petits commits sans importance qui ne concernent que ce fichier RESUME_SESSION.md. Le nombre exact se voit avec `git log origin/main..HEAD --oneline` ; un seul `git push` envoie tout.)

Identité Git configurée en local : Nohlan / nohlantb33@gmail.com. Pour voir ce qui reste à pousser : `git log origin/main..HEAD --oneline`.

## ⚠️ Crédits Netlify (contrainte importante)
Plan gratuit = **300 crédits/mois**, **chaque déploiement (= chaque `git push`) coûte 15 crédits**, limite stricte, remise à zéro le mois suivant. Début octobre 2026 il restait ~**90 crédits jusqu'au 22 octobre** (≈ 6 déploiements).
→ **Règle : committer souvent en local, mais ne proposer `git push` que par gros lots** (viser 3-4 pushes max d'ici le 22 octobre). Ne pas demander de push après chaque petite modif.

## Méthode de test utilisée (à refaire si besoin)
Petit serveur HTTP PowerShell (`System.Net.HttpListener`, port 8791) lancé en tâche de fond, puis navigateur intégré de Claude sur `http://localhost:8791/index.html` ; le serveur et son script sont supprimés après chaque test. Pas de Node/Python sur la machine. Pièges : le navigateur de test refuse/ignore les `confirm()` (suppressions annulées), les captures d'écran arrivent parfois en retard (animations de fondu), et `file://` ne marche pas pour tester le service worker (il faut `http://localhost`).

## Les 3 espaces (données totalement indépendantes, via `spaceKey()`)
Bouton en haut (ex : "🙋 Solo") pour basculer :
- **Solo** : calendrier détaillé Jour / Semaine / Mois.
- **Famille** : pareil + **Personnes** (nom, couleur, case **"Cette personne travaille"**) + **Animaux** (nom, couleur) assignables aux activités (bloc multicolore si plusieurs). En vue Mois : on sélectionne une personne qui travaille puis on clique des jours pour marquer ses jours de travail (fond très léger de sa couleur) ; ces jours sont aussi teintés dans les vues **Semaine** et **Jour**.
- **Entreprise** : Jour/Semaine/Mois ; le **Mois** est un tableau de présence par personne (sélection d'une personne, clic sur des jours = fond légèrement teinté, légende en haut) + les activités s'affichent en puces. Menu : Importer + Personnes disponibles.

## Fonctionnalités du planning
- Vues Jour / Semaine / Mois, transitions en fondu, bouton "Aujourd'hui"/"Mois actuel", clic sur un jour (Mois ou en-tête de Semaine) → ouvre la vue Jour.
- Formulaire d'activité : Ponctuel / Hebdomadaire / Quotidien, Semaines A/B, fin de répétition, importance (Mois n'affiche que Important / Très important sauf en Entreprise où tout s'affiche), salle/prof, 20 couleurs (même nom = même couleur).
- Vacances scolaires 2026-2027 (zones A/B/C), plage horaire réglable, division en demi-heures.
- Import **.ics** (fiable) et **.pdf** (détection par rectangles colorés, écran de vérification) ; "Vider mon planning".
- **Impression** : Menu → 🖨️ Imprimer (CSS `@media print`, fond clair quel que soit le thème).
- Planning mensuel : la grille s'arrête à la fin de la semaine qui contient le dernier jour du mois (`monthGridCellCount`).
- **Texte lisible** : `readableTextColor()` choisit texte sombre ou blanc selon la luminance de la couleur de fond (seuil 0.25).
- **11 thèmes** (Menu → Thème) : Clair, Pastel, Nature, Vibrant, Ardoise, Sombre, Océan + **Forêt, Améthyste, Braise, Rose nuit**. Les couleurs d'activités/habitudes/présence sont **nuancées vers l'accent du thème** (`themeAdaptColor()`, la couleur enregistrée n'est jamais modifiée) ; changer de thème redessine la vue.
- Mobile : barre du haut réorganisée (titre au-dessus, 3 boutons en ligne + "+ Ajouter une activité" pleine largeur), cases du mois à hauteur fixe (plus de lignes qui s'étirent).

## Le To-do (bouton "✅ To-do", plein écran façon Notes, données par espace)
Barre latérale : **📊 Tableau de bord**, **🎯 Tâches du jour**, puis les listes créées via "+ Nouvelle liste" (choix du type) :
- **Tableau de bord** (par défaut) : "Aujourd'hui" (tâches du jour cochables), "Routines" (habitudes du jour, cochables, synchronisées avec les grilles), "Mes listes" (nombre de tâches restantes, clic = ouvre la liste).
- **Tâches du jour** : liste de tâches pour **Aujourd'hui / Demain** (préparer la veille).
- **Liste normale** : onglets "À faire" / "✅ Déjà fait" (cocher = déplacer, recliquer = annuler, ✕ = supprimer).
- **Liste d'habitudes** (🔁) : vrai tableau jour × habitude (tous les jours du mois visibles sans défilement sur PC), % de réussite + série 🔥 par habitude, résumé global (% / Complété / Incomplet / Total), sélecteur "Cette semaine / Tout le mois" (ne change que les stats), navigation de mois, et section **📅 Habitudes mensuelles** (cochées une fois par mois, série en mois).
Inspiré de 2 vidéos de "habit trackers" (tableur) que Nohlan avait fournies.

## Idées non faites / possibles suites
- Objectifs mensuels / suivi humeur-sommeil dans les habitudes (idée n°6 de la liste d'origine).
- Afficher les habitudes mensuelles dans le Tableau de bord.
- Le Tableau de bord/To-do ne se redessine pas tout seul au changement de thème (seulement la vue calendrier).
- Un vrai compte multi-appareils (Supabase) a été évoqué puis mis de côté.
- Cas PDF non résolu : cases de groupes A/B d'élèves mélangées (demander le groupe de Nohlan).

## Détails techniques utiles
- Clés `localStorage` par espace : `monPlanningCours`, `...Personnes`, `...Animaux`, `...Assignations`, `...TodoListes`, `...TodoItems`, `...TodoListeActuelle`, `...Habitudes`, `...HabitudeChecks`, `...HabitudesMensuelles(Checks)`, `...HabitudeTaches` (tâches du jour) ; Solo garde les clés d'origine sans suffixe, les autres ont `_famille` / `_entreprise`.
- Piège CSS : une règle `display:flex` sur une classe écrase `.hidden` si elle est définie après ; solution utilisée : `.maClasse:not(.hidden)`.
- Service worker `sw.js` : cache `mon-planning-v1` ; **si on veut forcer les téléphones à recharger les fichiers après une grosse mise à jour, incrémenter `CACHE_NAME`** (v2, v3…). Il ne s'active qu'en HTTPS ou sur localhost.
- `renderMonthCalendar`, `renderCalendar`, `renderDayCalendar`, `renderEntrepriseMonth` partagent `applyPresenceFill()` pour la teinte de présence.

## Comment reprendre
Donner ce fichier à Claude Code au démarrage : *"Voici le résumé de nos sessions précédentes sur mon site Mon Planning, on continue à partir de là."* Penser au **git push groupé** et aux **crédits Netlify** ci-dessus.
