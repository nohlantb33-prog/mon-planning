# Résumé — Projet "Mon Planning"

## Contexte général
Nohlan (lycéen, TARDY-BATS Nohlan) construit un site de planning avec Claude Code, en suivant un guide pour non-développeurs ("Ton site en ligne, de A à Z"). Site 100% statique : HTML/CSS/JS pur, sans framework ni serveur (une seule dépendance externe : pdf.js via CDN, pour lire les PDF).

**Dossier du projet :** `C:\Users\nohla\Desktop\mon-site`
**Fichiers :** `index.html`, `style.css`, `script.js`
**Pour tester :** ouvrir `index.html` directement dans le navigateur (double-clic, ou `start index.html` en terminal).

## Étapes du guide déjà faites
- Étape 1-3 : accès Claude, application installée, prompt d'intro ✓
- Étape 4 (setup) : Git installé ✓, VS Code installé ✓ (ouvert sur le dossier du projet)
- **Pas encore fait** : Étape 6 (sauvegarde sur GitHub) — un `git commit` a été demandé mais bloqué : Git ne connaît pas encore le nom/email de Nohlan sur cette machine. Il faut lancer, avant de committer :
  ```
  git config --global user.name "Son Nom"
  git config --global user.email "son-email"
  ```
- **Pas encore fait** : Étape 7 (déploiement Netlify)

## Les 3 espaces (fonctionnalité majeure)
Un bouton dans l'en-tête (ex: "🙋 Solo") ouvre un sélecteur pour basculer entre 3 espaces, **aux données totalement indépendantes** (localStorage à clés séparées, sauf Solo qui garde les clés d'origine pour rester rétrocompatible) :

1. **Solo** : le planning personnel classique (calendrier détaillé par heure), comme avant l'ajout des espaces.
2. **Famille** : même calendrier détaillé, mais chaque activité peut être associée à une ou plusieurs **personnes** (nom + couleur, gérées dans Menu → 👥 Personnes). Dans le formulaire d'activité, des cases à cocher permettent de sélectionner une ou plusieurs personnes :
   - Une seule cochée → l'activité prend directement sa couleur.
   - Plusieurs cochées → le bloc de l'activité s'affiche **divisé en plusieurs couleurs** (dégradé), sur les vues Semaine, Jour **et Mois**.
3. **Entreprise** : interface différente, pas de calendrier horaire. Une liste de personnes (chips cliquables) + un calendrier mensuel simple : on sélectionne une personne puis on clique sur des jours pour les "peindre" à sa couleur (présence/planning simplifié). Reclic pour retirer.

Le Menu s'adapte aussi à l'espace actif : les onglets Import/Semaines A/B/Vacances sont masqués en Entreprise (non pertinents), et l'onglet Personnes n'apparaît qu'en Entreprise/Famille.

## Fonctionnalités construites dans le site
- **3 vues** (ordre des onglets : Jour / Semaine / Mois) : Jour (une colonne, noms visibles), Semaine (calendrier compact, hauteur ajustée à l'écran), Mois (calendrier classique, n'affiche que les activités "Important"/"Très important")
- **Formulaire d'activité** : bouton "+ Ajouter une activité" (anciennement "cours"), type par défaut = **Ponctuel**
- **Types d'activité** : Ponctuel (date précise), Hebdomadaire (jour fixe, option Semaine A/B alternée), Quotidien — avec fin de répétition (jamais / après N fois / jusqu'à une date)
- **Vacances scolaires** : zone A/B/C sélectionnable (Menu → Vacances), dates officielles 2026-2027, exclut automatiquement les activités récurrentes pendant les vacances
- **Semaines A/B** : pour cours alternant une semaine sur deux (Menu → Semaines A/B définit la date de référence)
- **Importance** : Pas important / Important (visible en Mois) / Très important (encadré rouge, couleur de fond conservée en plus depuis peu)
- **Blocs compacts** : les activités longues (sommeil, >3h) sont affichées en hauteur réduite pour ne pas surcharger la vue Semaine
- **Plage horaire réglable** : "Afficher de ___h à ___h" dans la vue Semaine
- **Division en demi-heures** : clic sur une case horaire précise pour la diviser finement
- **7 thèmes** : Clair, Pastel, Nature, Vibrant, Ardoise, Sombre, Océan (Menu → Thème)
- **20 couleurs** disponibles pour les activités ; une activité de même nom reprend automatiquement la même couleur (y compris lors d'un import, ou entre import .ics et .pdf)
- **Menu** (bouton "⚙️ Menu") : liste de titres uniquement (rien de présélectionné) ; cliquer sur un titre ouvre son contenu dans une fenêtre à part avec bouton "← Retour". Onglets selon l'espace : Thème, Astuces, Importer, Semaines A/B, Vacances, Personnes
- **Astuces** : petits messages contextuels, fermables individuellement (✕), retrouvables dans Menu → Astuces
- **Import .ics** : fiable, détecte les cours récurrents vs ponctuels automatiquement, couleurs cohérentes par nom d'activité
- **Import .pdf** : détection basée sur les **rectangles de couleur** dessinés dans le PDF (pas seulement le texte) pour connaître la vraie durée de chaque case, avec calibrage automatique du décalage de rendu propre à chaque fichier (voir détails techniques). Repli sur une détection texte/ligne si le PDF n'a pas de rectangles exploitables. Écran de vérification avant validation (case à cocher + champs éditables : activité, jour, début, fin, salle, prof). Option "Ce PDF ne concerne qu'une seule semaine précise" pour créer des activités ponctuelles à des dates réelles plutôt que récurrentes.
- **Bouton "Vider mon planning"** (Menu → Importer) pour repartir de zéro, avec confirmation
- **Écran de bienvenue** (prénom + email) au premier lancement — juste pour personnaliser l'accueil, PAS un vrai système de compte (site statique, tout est stocké dans le navigateur via localStorage)

## Sujets discutés mais non résolus / en attente
1. **Git commit en attente** : il faut le nom/email Git de Nohlan (voir plus haut) pour finaliser le premier commit.
2. **Cas particulier PDF non résolu** : dans l'emploi du temps de Nohlan (espace Solo), le mardi midi (10h10-11h05 et 13h00-13h55) contient des cases partagées entre deux groupes d'élèves (A/B) que le PDF mélange forcément. Il faut demander à Nohlan son groupe (A ou B) pour corriger ces deux entrées à la main — ce n'est PAS lié au système "Semaines A/B" de l'app (qui gère l'alternance d'une semaine sur l'autre, pas les groupes d'élèves simultanés).
3. **Vrai compte / multi-appareils** : intérêt montré pour un vrai système de compte (Supabase) avec emails automatiques et accès multi-appareils, mais Nohlan a choisi de **finir l'app d'abord**. Plan discuté si repris un jour : (1) créer un compte Supabase, (2) créer un projet Supabase, (3) authentification par email, (4) migrer les données du navigateur vers la base de données, (5) envoi d'emails de rappel (ex: Resend).
4. **Import multi-personnes / planning du mois** : question initiale de Nohlan qui a fait naître les espaces Entreprise/Famille (voir plus haut) — largement répondu par cette fonctionnalité. Si un vrai import de fichier externe (PDF/Excel) pour l'espace Entreprise est encore souhaité un jour, il faudra redemander le type de fichier exact.

## Détails techniques utiles pour la suite
- **pdf.js** chargé via CDN (`cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/`) pour lire les PDF côté navigateur, aucun serveur nécessaire.
- **Extraction PDF par rectangles colorés** (fonction `extractColoredRects` dans `script.js`) : parcourt `page.getOperatorList()` (opérations `constructPath` + `fill`), applique la matrice de transformation courante pour obtenir les coordonnées réelles. Bien plus fiable que la position du texte seul pour connaître la vraie durée d'un cours (le texte ne remplit pas forcément toute la case). Le décalage entre bord de rectangle et repère horaire réel est calibré automatiquement par fichier (voir `topOffset`/`bottomOffset` dans `detectGridSchedule`), en se basant uniquement sur le tout premier cours de chaque jour (le seul repère sans ambiguïté).
- **Espaces** : `spaceKey(baseKey)` (dans `script.js`) fait pointer chaque `localStorage` vers une clé différente selon l'espace actif (`monPlanningCours_entreprise`, `monPlanningPersonnes_famille`, etc.), sauf Solo qui garde les clés historiques.
- **Piège CSS rencontré** : une règle générique comme `.modal label { display: block }` peut avoir plus de spécificité qu'une classe seule (`.ma-classe { display: flex }`) et l'emporter silencieusement. Solution : qualifier avec le tag (`.modal label.ma-classe { ... }`). Ça a cassé l'affichage des pastilles de couleur dans les cases à cocher "Personne(s)" jusqu'à ce que ce soit corrigé.
- Toutes les données sont dans le `localStorage` du navigateur — rien n'est envoyé à un serveur.
- **Méthode de test utilisée pendant ces sessions** : un petit serveur HTTP local (script PowerShell avec `System.Net.HttpListener`, pas besoin de Node/Python) pour piloter le site via le navigateur Claude et déboguer précisément (notamment le parseur PDF, en comparant aux vraies coordonnées extraites). Utile à refaire si un nouveau bug coriace apparaît.

## Comment reprendre la prochaine fois
Donne ce fichier à Claude Code au démarrage de la prochaine session (glisse-le dans le dossier ou colle son contenu), avec un message du type : *"Voici le résumé de nos sessions précédentes sur mon site Mon Planning, on continue à partir de là."*
