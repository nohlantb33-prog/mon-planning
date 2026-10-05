# Résumé — Projet "Mon Planning" (mis à jour le 2026-10-05)

## Contexte général
Nohlan (lycéen) construit avec Claude Code un site de planning **100 % statique** (HTML/CSS/JS pur, pas de framework ni de serveur ; seule dépendance externe : pdf.js via CDN pour l'import PDF). Il est en train d'apprendre : expliquer simplement, étape par étape, en français. Toutes les données sont dans le `localStorage` du navigateur (rien n'est envoyé à un serveur).

- **Dossier :** `C:\Users\nohla\Desktop\mon-site` — fichiers : `index.html`, `style.css`, `script.js`, `manifest.json`, `sw.js`, `icons/`
- **Dépôt GitHub :** https://github.com/nohlantb33-prog/mon-planning (branche `main`)
- **Site en ligne (Netlify, URL non référencée, protégée par connexion) :** https://splendorous-douhua-9e49e6.netlify.app — se redéploie automatiquement à chaque push sur `main`
- **Installable comme une app** (PWA : manifest + service worker + icônes). Testé installé sur le téléphone de Nohlan.

## ⚠️ État Git : des commits PAS ENCORE poussés (11 vraies nouveautés)
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
7. `a147570` Le To-do suit aussi le thème choisi
8. `0ffa4b6` Habitudes mensuelles visibles dans le Tableau de bord
9. `4914e56` Questionnaire de personnalisation + suggestions « Pour toi »
10. `e7f2bba` Page « Mon profil » modifiable, âge calculé depuis la naissance, heures déplacées dans le profil, bug du questionnaire bloqué corrigé
11. (ce commit) Heures propres à chaque planning dans Mon profil ; thème retiré du questionnaire et du profil
`CACHE_NAME` passé à `mon-planning-v2` juste avant ce push (prochaine grosse mise à jour : v3).
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
- Vacances scolaires 2026-2027 (zones A/B/C), plage horaire réglable (dans Menu → Mon profil), division en demi-heures.
- Import **.ics** (fiable) et **.pdf** (détection par rectangles colorés, écran de vérification) ; "Vider mon planning".
- **Impression** : Menu → 🖨️ Imprimer (CSS `@media print`, fond clair quel que soit le thème).
- Planning mensuel : la grille s'arrête à la fin de la semaine qui contient le dernier jour du mois (`monthGridCellCount`).
- **Texte lisible** : `readableTextColor()` choisit texte sombre ou blanc selon la luminance de la couleur de fond (seuil 0.25).
- **11 thèmes** (Menu → Thème) : Clair, Pastel, Nature, Vibrant, Ardoise, Sombre, Océan + **Forêt, Améthyste, Braise, Rose nuit**. Les couleurs d'activités/habitudes/présence sont **nuancées vers l'accent du thème** (`themeAdaptColor()`, la couleur enregistrée n'est jamais modifiée) ; changer de thème redessine la vue et le To-do s'il est ouvert (cases d'habitudes cochées comprises, ✓ lisible via `habitCheckStyle()`).
- Mobile : barre du haut réorganisée (titre au-dessus, 3 boutons en ligne + "+ Ajouter une activité" pleine largeur), cases du mois à hauteur fixe (plus de lignes qui s'étirent).

## Le To-do (bouton "✅ To-do", plein écran façon Notes, données par espace)
Barre latérale : **📊 Tableau de bord**, **🎯 Tâches du jour**, puis les listes créées via "+ Nouvelle liste" (choix du type) :
- **Tableau de bord** (par défaut) : "Aujourd'hui" (tâches du jour cochables), "Routines" (habitudes du jour + habitudes mensuelles du mois en cours sous "📅 Ce mois-ci", cochables, synchronisées avec les listes), "Mes listes" (nombre de tâches restantes, clic = ouvre la liste).
- **Tâches du jour** : liste de tâches pour **Aujourd'hui / Demain** (préparer la veille).
- **Liste normale** : onglets "À faire" / "✅ Déjà fait" (cocher = déplacer, recliquer = annuler, ✕ = supprimer).
- **Liste d'habitudes** (🔁) : vrai tableau jour × habitude (tous les jours du mois visibles sans défilement sur PC), % de réussite + série 🔥 par habitude, résumé global (% / Complété / Incomplet / Total), sélecteur "Cette semaine / Tout le mois" (ne change que les stats), navigation de mois, et section **📅 Habitudes mensuelles** (cochées une fois par mois, série en mois).
Inspiré de 2 vidéos de "habit trackers" (tableur) que Nohlan avait fournies.

## Questionnaire de personnalisation + page « Mon profil » (2026-10-05)
- Après l'écran prénom + e-mail (bouton « Continuer »), un questionnaire d'une question par écran, avec barre de progression : **mois + année de naissance** (l'âge se calcule tout seul, `ageFromNaissance()` / `describeAge()` → ex. « 17 ans · 18 ans en mai 2027 »), situation (collège/lycée/études/travail/recherche/autre), zone de vacances et semaines A/B (seulement pour les élèves/étudiants), pour qui (Moi / Famille / Entreprise), objectifs (10 choix), heures de la journée (pré-remplies selon la situation), puis un récapitulatif. **Pas de question sur le thème** (il y a déjà Menu → Thème). Les choix uniques passent tout seuls à la question suivante (minuteur `qAdvanceTimer`, annulé si on navigue) ; le bouton devient « Passer » si on ne répond pas.
- Validation (`applyProfile()`, découpée en `applyProfileHours` / `applyProfileZone` / `applyProfileSemaine` / `applyProfileHabits`) : heures dans le Solo + les plannings choisis la 1re fois (seulement le Solo quand on refait le questionnaire, pour ne pas écraser les autres), zone + semaine A/B (Solo + Famille), et une liste d'habitudes **« 🎯 Mes objectifs »** dans le To-do du Solo (habitudes quotidiennes et mensuelles selon `OBJECTIFS`, jamais en double). Démarre dans l'espace principal choisi.
- Réponses dans `monPlanningProfil` (clé globale, pas par espace) : objet unique prévu pour être envoyé tel quel dans Supabase plus tard. Les anciens profils avec une tranche d'âge (`age`) restent compris (`isUnder15()`) ; la tranche est supprimée dès qu'une date de naissance est indiquée.
- **Menu → 👤 Mon profil** : page qui affiche toutes les réponses, **modifiables une par une** avec enregistrement immédiat (« ✓ Enregistré ») : prénom, e-mail, naissance, situation, zone, semaines A/B (affiche la vraie lettre de la semaine en cours), **heures affichées pour chaque planning séparément** (Solo, Famille, Entreprise), pour qui, objectifs (cocher = ajoute les habitudes ; décocher ne les supprime pas). Pas de réglage du thème ici (Menu → Thème suffit). Bouton **« 🔁 Refaire le questionnaire »** en bas.
- Le réglage « Afficher de …h à …h » a été **retiré de l'écran principal** : les heures se règlent seulement dans Mon profil, chaque planning a les siennes (`applyProfileHours(debut, fin, espaces)`).
- Tableau de bord : carte **« 💡 Pour toi »** (3 suggestions max, `dashboardSuggestions()`) : faire le questionnaire s'il n'a jamais été rempli, importer son emploi du temps (élève sans activités), ajouter les membres Famille/Entreprise, encouragement sur les habitudes des objectifs (série 🔥 ou « petit objectif du jour »).
- Moins de 15 ans : message dans le récapitulatif (accord d'un parent nécessaire quand il y aura les comptes en ligne).
- Bug corrigé : les boutons Suivant/Retour/✕ n'étaient branchés que lors de la toute première visite, donc le questionnaire relancé plus tard se bloquait à « Pour qui » (1re étape sans passage automatique).

## Idées non faites / possibles suites
- Objectifs mensuels / suivi humeur-sommeil : **mis de côté** (2026-10-05). Nohlan voulait le relier à Santé (iPhone) ou à d'autres apps de suivi, impossible pour un site web (HealthKit et Health Connect sont réservés aux vraies apps natives). On y reviendra si le site devient une vraie app. Pistes notées : saisie rapide humeur + sommeil dans le site, ou pont semi-automatique via l'app Raccourcis iPhone (à tester : Safari et l'app installée ne partagent pas leur localStorage).
- **Comptes Supabase (prochain gros chantier, décidé le 2026-10-05)** : plan validé avec Nohlan : (1) questionnaire ✅ fait ; (2) comptes perso (Supabase Auth, Solo synchronisé PC/téléphone, import des données locales à la 1re connexion) ; (3) espaces Famille/Entreprise partagés (tables espaces + membres avec rôles propriétaire/admin/membre, code d'invitation) ; (4) temps réel + page Confidentialité + suppression de compte. Sécurité : Row Level Security obligatoire, ne jamais mettre la clé service_role dans le site. Gratuit : 500 Mo, 50 000 utilisateurs/mois, **pause après 7 jours sans activité**, pas de sauvegardes. RGPD : moins de 15 ans = accord d'un parent. **Plan validé pour les moins de 15 ans** (âge calculé depuis `naissance`) : (a) à l'inscription, demander l'e-mail d'un parent qui reçoit un lien « J'accepte » ; compte « en attente » (utilisable en local, pas de synchro) jusqu'à l'accord ; enregistrer la date ; le parent peut retirer l'accord / supprimer le compte ; (b) ou le parent invite l'enfant depuis son espace Famille (= accord). Plus besoin d'accord dès 15 ans. Aujourd'hui (tout en localStorage, rien envoyé) aucun accord n'est nécessaire. Envoi des mails : service d'e-mail limité sur le plan gratuit Supabase, à prévoir. Nohlan doit créer lui-même le compte supabase.com (Claude ne peut pas créer de compte).
- Cas PDF non résolu : cases de groupes A/B d'élèves mélangées (demander le groupe de Nohlan).

## Détails techniques utiles
- Clés `localStorage` par espace : `monPlanningCours`, `...Personnes`, `...Animaux`, `...Assignations`, `...TodoListes`, `...TodoItems`, `...TodoListeActuelle`, `...Habitudes`, `...HabitudeChecks`, `...HabitudesMensuelles(Checks)`, `...HabitudeTaches` (tâches du jour) ; Solo garde les clés d'origine sans suffixe, les autres ont `_famille` / `_entreprise`.
- Piège CSS : une règle `display:flex` sur une classe écrase `.hidden` si elle est définie après ; solution utilisée : `.maClasse:not(.hidden)`.
- Service worker `sw.js` : cache `mon-planning-v1` ; **si on veut forcer les téléphones à recharger les fichiers après une grosse mise à jour, incrémenter `CACHE_NAME`** (v2, v3…). Il ne s'active qu'en HTTPS ou sur localhost.
- `renderMonthCalendar`, `renderCalendar`, `renderDayCalendar`, `renderEntrepriseMonth` partagent `applyPresenceFill()` pour la teinte de présence.

## Comment reprendre
Donner ce fichier à Claude Code au démarrage : *"Voici le résumé de nos sessions précédentes sur mon site Mon Planning, on continue à partir de là."* Penser au **git push groupé** et aux **crédits Netlify** ci-dessus.
