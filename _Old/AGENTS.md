# AGENTS.md

## Mission
Transformer les écrans du projet en une application réelle, industrialisable, maintenable et fidèle.

## Règle absolue
Les écrans sont la source de vérité produit et design.

Interdictions absolues :
- ne pas réinterpréter librement le design ;
- ne pas simplifier les écrans sans autorisation ;
- ne pas fusionner des écrans ou modules ;
- ne pas modifier les wording ;
- ne pas changer la logique produit ;
- ne pas supprimer d’options visibles dans les écrans ;
- ne pas ignorer panneaux, popovers, modales, tables, paramètres, vues d’administration ;
- ne pas introduire de dépendances beta, alpha, rc, canary ou expérimentales ;
- ne pas utiliser d’API expérimentales sans validation explicite.

## Priorité produit
1. Éditeur Canvas / Template
2. Données dynamiques / mapping / variables / presets
3. Intégration IA paramétrable et gouvernable
4. Gestion des assets, objets, pages, calques, bibliothèques
5. Fiches candidats / utilisateurs / contenus
6. Administration, paramètres techniques, paiements, règlements, sécurité, logs

## Cœur du produit
L’éditeur Canvas / Template est le centre absolu du produit.
Tous les autres modules servent l’éditeur : alimentation, configuration, enrichissement, sécurisation, intégration données, intégration IA, exploitation des templates.

Ne jamais traiter l’administration, l’auth, la fiche candidat ou les paiements comme le centre du produit.

## Modules à implémenter
- éditeur canvas / template ;
- module données / variables / presets / mapping ;
- dashboard complet ;
- authentification ;
- fiche candidat multi-écrans / multi-onglets ;
- gestion utilisateurs ;
- gestion candidats ;
- gestionnaire de tags ;
- tag picker / popover ;
- administration & paramétrages ;
- paramètres généraux ;
- utilisateurs & rôles ;
- base de données ;
- serveur mail & notifications ;
- LLM / IA / API ;
- paiements & facturation ;
- suivi des règlements ;
- logs & audits si présents dans les écrans ;
- tout shell global commun.

## Stack imposée
Utiliser uniquement des versions stables.
Base cible :
- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

Règles stack :
- aucune dépendance expérimentale ;
- aucune API expérimentale ;
- architecture modulaire ;
- composants réutilisables ;
- typage strict ;
- build propre ;
- lint propre ;
- structure claire.

Si le repo est greenfield, utiliser par défaut :
- PostgreSQL
- Prisma ORM
- architecture modulaire services / repositories / schemas
- typage strict bout en bout
- API stable uniquement

## Architecture attendue
Organiser le projet avec des modules clairs :
- app / routes
- layouts
- modules
- components
- ui
- editor
- data-mapping
- ai
- admin
- auth
- candidates
- users
- payments
- settings
- lib
- hooks
- services
- schemas
- mocks
- tests

## Composants à mutualiser
Créer et réutiliser au maximum :
- AppShell
- Sidebar
- Topbar
- SectionCard
- StatCard
- DataTable
- StatusBadge
- Tabs
- Stepper
- FormField
- RightPanel
- Modal
- Popover
- Drawer si nécessaire
- TagChip
- TagPicker
- MappingPanel
- BindingField
- PromptSelector
- LLMProviderSelector
- ActivityTimeline
- ChartCard
- ProgressBar
- CandidateCard
- UserCard
- SettingsPanel
- EditorToolbar
- InspectorPanel
- LayerPanel
- AssetsLibrary
- PagesPanel
- ObjectsPanel
- VariablesPanel
- PresetsPanel

## Mode de travail sur repo existant
Toujours agir comme un lead engineer responsable.

Avant toute implémentation significative, obligatoirement :
1. auditer le repo ;
2. identifier l’existant réutilisable ;
3. produire une cartographie précise ;
4. produire une matrice écrans → routes → composants ;
5. produire un plan de fichiers exact.

### Audit obligatoire
Lire systématiquement :
- arborescence ;
- package.json ;
- lockfiles ;
- tsconfig ;
- next.config ;
- config Tailwind ;
- config shadcn si présente ;
- lint / format / test config ;
- architecture app actuelle ;
- state management ;
- data layer ;
- auth ;
- API ;
- base de données ;
- conventions internes.

### Identifier l’existant réutilisable
- shell existant ;
- primitives UI ;
- tables ;
- formulaires ;
- modales ;
- charts ;
- logique data ;
- logique auth ;
- logique admin.

### Cartographie précise
Lister explicitement :
- pages/routes existantes ;
- pages/routes à créer ;
- composants à conserver ;
- composants à refactorer ;
- composants à créer ;
- stores/hooks/services à créer ;
- risques techniques ;
- conflits potentiels avec la fidélité design ;
- dépendances manquantes ;
- points bloquants.

### Matrice écrans → routes → composants
Pour chaque écran :
- route cible ;
- layout utilisé ;
- composants principaux ;
- composants mutualisés ;
- données nécessaires ;
- état local / global ;
- dépendances ;
- interactions critiques.

### Plan de fichiers exact
Avant les gros lots, proposer :
- fichiers à créer ;
- fichiers à modifier ;
- fichiers à ne pas toucher ;
- impact par module ;
- ordre d’intervention.

## Discipline de modification
- ne pas réécrire massivement le repo sans nécessité ;
- préserver l’existant quand il est compatible ;
- refactorer seulement si cela aide la fidélité ou la maintenabilité ;
- travailler par lots reviewables ;
- garder des diffs lisibles ;
- éviter les changements transverses flous ;
- ne pas casser une zone pour en améliorer une autre.

Si l’existant contredit les écrans :
1. signaler précisément le conflit ;
2. proposer la stratégie minimale ;
3. prioriser la fidélité produit/design ;
4. limiter la dette introduite.

## Stratégie d’implémentation
### Étape 1 — Audit
- inspecter le repo ;
- identifier ce qui existe ;
- repérer la stack réelle ;
- localiser les écrans / assets / références ;
- dresser la cartographie des pages, routes, composants, patterns ;
- identifier les écarts.

### Étape 2 — Plan d’exécution
- proposer un plan centré d’abord sur l’éditeur ;
- découper en lots cohérents ;
- prioriser les composants structurants ;
- identifier les dépendances critiques ;
- donner l’ordre d’attaque exact.

### Étape 3 — Fondations
- design tokens ;
- layout global ;
- navigation ;
- thème ;
- composants de base ;
- cartes ;
- tables ;
- formulaires ;
- modales ;
- popovers ;
- badges ;
- graphiques.

### Étape 4 — Éditeur en premier
Commencer d’abord par :
- shell éditeur ;
- canvas ;
- inspecteur ;
- panneaux principaux ;
- sélection / manipulation ;
- bibliothèques ;
- données dynamiques ;
- mapping ;
- intégration IA par champ.

### Étape 5 — Modules satellites
Ensuite seulement :
- dashboard ;
- auth ;
- candidats ;
- utilisateurs ;
- tags ;
- administration ;
- paiements ;
- règlements.

### Étape 6 — Qualité
- vérifier fidélité visuelle ;
- vérifier cohérence inter-écrans ;
- vérifier accessibilité de base ;
- vérifier responsive desktop-first ;
- vérifier typage ;
- vérifier lint ;
- vérifier build ;
- vérifier absence d’erreurs runtime ;
- vérifier cohérence des états.

## Mode d’exécution ultra-opérationnel
Travailler comme sur un produit critique.
Toujours avancer de manière séquencée, explicite, vérifiable et reviewable.
Ne jamais faire de gros changements flous sans les cadrer.

### Règle de démarrage
Avant d’écrire du code significatif, obligatoirement :
1. inspecter le repo ;
2. cartographier l’existant ;
3. identifier le shell global ;
4. identifier le noyau éditeur ;
5. lister tous les écrans à implémenter ;
6. produire un plan exact ;
7. produire un plan de fichiers exact ;
8. seulement ensuite commencer l’implémentation.

### Phase 0 — Lecture obligatoire du repo
Lire systématiquement :
- arborescence du repo ;
- package.json ;
- lockfile ;
- tsconfig.json ;
- next.config.* ;
- config Tailwind ;
- config PostCSS ;
- config ESLint / Prettier ;
- composants UI existants ;
- layouts existants ;
- app router / routes ;
- state management ;
- services / API layer ;
- data access layer ;
- auth layer ;
- éventuels fichiers editor/canvas ;
- éventuels fichiers mapping / prompt / ai ;
- éventuels fichiers admin / settings / payments.

Objectif : comprendre ce qui existe, ce qui est réutilisable, ce qui doit être corrigé, ce qui est incompatible, ce qu’il faut créer.

### Sortie attendue après phase 0
Produire :
- inventaire technique ;
- inventaire produit ;
- analyse d’écart ;
- cible d’architecture ;
- matrice écrans → routes → composants → données ;
- plan de fichiers exact.

### Règle de précaution
Ne pas partir trop vite dans du code.
D’abord comprendre précisément le repo.
Éviter les refactors larges si un chemin plus local et plus sûr existe.

### Phase 1 — Baseline structurelle
Après audit, mettre en place :
- design tokens ;
- thème global ;
- layout shell global ;
- sidebar ;
- topbar ;
- zone de contenu ;
- primitives de tableaux ;
- primitives formulaires ;
- modales ;
- popovers ;
- panneaux latéraux ;
- badges ;
- onglets ;
- stepper si nécessaire.

### Phase 2 — Cœur produit : l’éditeur
Ordre obligatoire :
1. shell de l’éditeur
2. structure du canvas
3. topbar éditeur
4. sidebar/panneaux
5. inspecteur/propriétés
6. pages/calques/objets/bibliothèques
7. sélection/manipulation
8. données dynamiques
9. mapping
10. IA paramétrable par champ

Ne jamais faire une fausse page d’éditeur.
Construire un vrai socle exploitable.
Même si certaines capacités sont mockées, l’architecture doit être pensée comme un vrai éditeur.

### Phase 3 — Données / mapping / presets
Ordre conseillé :
1. modèle des variables
2. modèle des presets
3. bindings de base
4. mappings par type de champ
5. répétiteurs
6. fallback values
7. preview des injections
8. validation des mappings
9. configuration par template

### Phase 4 — IA paramétrable
Ordre conseillé :
1. structure des fournisseurs LLM
2. structure des modèles
3. bibliothèque de prompts
4. versioning des prompts
5. UI de configuration globale
6. UI de liaison IA par champ
7. logique de déclenchement / preview
8. logs et traçabilité
9. gestion des fallback / validation humaine si nécessaire

### Exigence opérationnelle IA
Toujours montrer :
- où se configure le provider ;
- où se configure le modèle ;
- où se configure le prompt ;
- où se configure le contexte ;
- où se configure le résultat cible ;
- comment se fait la preview ;
- comment se fait le contrôle.

### Phase 5 — Modules satellites
Quand le noyau éditeur + données + IA est suffisamment posé, implémenter :
- dashboard ;
- auth ;
- fiche candidat ;
- gestion utilisateurs ;
- gestion candidats ;
- tags ;
- administration ;
- base de données ;
- serveur mail ;
- paiements ;
- règlements.

Ne pas commencer par les modules satellites si le noyau produit n’est pas structuré.

## Lots
Travailler en lots petits, cohérents et reviewables.

Format obligatoire des lots :
- Lot N — Objectif
- Écrans concernés
- Composants concernés
- Fichiers créés
- Fichiers modifiés
- Risques
- Vérifications
- Résultat attendu

Exemple de lots attendus :
- Lot 0 — Audit repo et plan d’attaque
- Lot 1 — Shell global et design system
- Lot 2 — Shell éditeur
- Lot 3 — Canvas + sélection + manipulation
- Lot 4 — Inspecteur + bibliothèques + calques/pages/objets
- Lot 5 — Variables + presets + data bindings
- Lot 6 — Mapping avancé
- Lot 7 — IA globale + prompts + liaisons IA par champ
- Lot 8 — Dashboard
- Lot 9 — Auth
- Lot 10 — Fiche candidat
- Lot 11 — Gestion utilisateurs / candidats / tags
- Lot 12 — Administration / base / mail / API / paiements / règlements

## Discipline de codage
- ne jamais coder à l’aveugle ;
- ne jamais créer 20 fichiers non justifiés ;
- ne jamais dupliquer un composant si un composant mutualisé est préférable ;
- ne jamais casser l’architecture pour aller plus vite ;
- ne jamais choisir une implémentation temporaire non signalée ;
- ne jamais cacher un arbitrage important.

## Discipline de validation
Après chaque lot, vérifier :
- build ;
- typecheck ;
- lint ;
- imports ;
- cohérence des routes ;
- cohérence des composants ;
- cohérence visuelle ;
- absence d’erreurs évidentes.

## Format de compte-rendu obligatoire après chaque lot
Toujours répondre avec :
1. Ce qui a été fait
2. Fichiers créés / modifiés
3. Ce qui est fidèle aux écrans
4. Écarts / hypothèses
5. Vérifications effectuées
6. Risques restants
7. Prochain lot proposé

## Gestion des ambiguïtés
- si le sujet est mineur, hypothèse conservatrice + signalement ;
- si le sujet impacte l’architecture ou la fidélité écran, s’arrêter et poser une question ciblée.

Les questions doivent être :
- rares,
- ciblées,
- bloquantes,
- actionnables.

Jamais de questions vagues du type :
- Que préférez-vous ?
- Souhaitez-vous que je continue ?
- Dois-je créer cela ?

## Détection des fonctionnalités
Quand les écrans sont lus, les traiter comme des spécifications fonctionnelles.
Repérer explicitement :
- composants visibles ;
- interactions implicites ;
- états implicites ;
- dépendances de navigation ;
- logique d’édition ;
- logique de données ;
- logique d’admin ;
- logique d’IA ;
- logique de mapping ;
- logique de paiement ;
- logique de supervision.

## Checklist finale obligatoire
Avant de considérer le projet correctement engagé, confirmer que :
- l’éditeur est bien le centre du produit ;
- toutes les fonctionnalités visibles de l’éditeur sont prises en compte ;
- le mapping est traité comme un module avancé ;
- l’IA est paramétrable globalement et par champ ;
- la base de données est pensée comme un vrai module robuste ;
- les settings/admin sont cohérents avec le cœur produit ;
- les écrans satellites ne dérivent pas du design source ;
- la structure du repo reste propre et maintenable.

## Livrables attendus à chaque itération
À chaque lot :
1. ce qui est implémenté ;
2. les fichiers créés/modifiés ;
3. les décisions minimales prises ;
4. les écarts éventuels et pourquoi ;
5. les risques ;
6. les prochaines étapes.

## Format de réponse attendu
Structurer systématiquement avec :
- Audit
- Plan
- Fichiers impactés
- Implémentation
- Vérifications
- Risques / ambiguïtés
- Suite proposée

## Definition of Done par lot
Un lot n’est terminé que si :
- le rendu respecte l’écran ;
- le build passe ;
- le typage passe ;
- le lint passe ;
- les interactions principales fonctionnent ;
- aucun placeholder grossier ne casse la crédibilité ;
- les composants sont rangés proprement ;
- les régressions évidentes sont évitées.

## Règle de fidélité
Si un arbitrage est nécessaire entre rapidité, simplification et exactitude, toujours choisir l’exactitude aux écrans.

## Critère final de succès
Le résultat doit donner l’impression que les écrans ont été transformés directement en application réelle, sans trahison produit, sans dérive design, sans simplification abusive, et avec :
- un vrai noyau éditeur robuste ;
- un vrai module de données avancé ;
- un vrai module IA paramétrable ;
- un vrai module de mapping solide ;
- une base technique sérieuse ;
- une administration crédible et exploitable.

## Instruction finale de démarrage
Commencer par cette séquence stricte :
1. afficher et analyser l’arborescence du repo ;
2. lire package.json et les configs clés ;
3. identifier la stack réelle ;
4. identifier les composants déjà présents ;
5. identifier les modules déjà présents ;
6. produire la cartographie complète ;
7. produire la matrice écrans → routes → composants ;
8. produire le plan de fichiers exact ;
9. proposer l’ordre de lots ;
10. puis implémenter immédiatement le Lot 1 sans perdre aucune exigence fonctionnelle.

## Rôle des AGENTS imbriqués
Les AGENTS imbriqués apportent des règles plus spécifiques pour :
- `app/editor`
- `app/data-mapping`
- `app/ai`
- `app/admin`

Appliquer les règles du présent fichier partout, puis affiner avec les règles locales du dossier concerné.

## Skill Governance Policy

Default policy: deny by default.
Do not browse or use installed skills unless a skill is clearly necessary for the current lot.

### Core rule
Use the minimum number of skills required for the current step.
Do not mentally activate more than 2 or 3 skills for the same lot.
Do not mix planning, design, debugging, testing, and architecture skills in the same step unless explicitly justified.

### Always-allowed baseline skills
These may be used when relevant across the project:
- writing-plans
- verification-before-completion
- requesting-code-review

### Explicit-approval-only skills
These must not be used unless explicitly justified in the current task:
- subagent-driven-development
- systematic-debugging
- frontend-design
- web-design-guidelines
- analytics-tracking

### Module-allowed skills

#### Editor / Canvas / Template
Allowed only when working directly on the editor, canvas, inspector, libraries, layers, pages, objects, rich text, or editor interactions:
- canvas-design
- tiptap
- zustand-state-management
- shadcn
- vercel-react-best-practices
- tailwind-design-system
- design-system-patterns
- motion

Forbidden for editor lots unless explicitly needed:
- tanstack-table
- analytics-tracking
- better-auth
- clerk-auth

#### Data / Mapping / Variables / Presets
Allowed only when working on data modeling, bindings, repeaters, presets, variable schemas, field linking, preview, or mapping validation:
- database-design
- database-schema-designer
- frontend-to-backend-requirements
- api-design-principles

Forbidden for mapping lots unless explicitly needed:
- frontend-design
- web-design-guidelines
- canvas-design

#### AI / LLM / Prompting / Field-level AI
Allowed only when working on provider setup, model config, prompt libraries, field-level AI linking, AI outputs, previews, logs, or AI execution:
- openai-api
- openai-responses
- ai-sdk
- ai-sdk-ui
- prompt-engineering-patterns

Forbidden for AI lots unless explicitly needed:
- frontend-design
- tanstack-table
- canvas-design

#### Admin / Settings / Users / Billing / Logs
Allowed only when working on admin screens, settings, roles, database admin, email config, payments, billing, logs, audits, or system health:
- tanstack-table
- database-design
- database-schema-designer
- api-design-principles
- analytics-tracking

Forbidden for admin lots unless explicitly needed:
- tiptap
- canvas-design

#### Auth
Use only one auth direction, never both at the same time:
- better-auth
- clerk-auth

If one auth stack is selected, the other must remain unused.

#### Testing / QA / Validation
Allowed when validating lots, stabilizing features, or preparing completion:
- playwright-local
- vitest
- qa-test-planner
- verification-before-completion
- requesting-code-review

### Phase-based activation

#### Phase 1 — Audit / planning
Preferred:
- writing-plans
- next-best-practices
- requirements-clarity

Do not use:
- frontend-design
- web-design-guidelines
- tanstack-table
- playwright-local

#### Phase 2 — Foundations / shell / shared UI
Preferred:
- vercel-react-best-practices
- shadcn
- tailwind-design-system
- design-system-patterns

Do not use:
- systematic-debugging unless a real bug exists
- openai-api
- database-schema-designer

#### Phase 3 — Editor / canvas
Preferred:
- canvas-design
- zustand-state-management
- tiptap
- vercel-react-best-practices

Do not use:
- tanstack-table
- analytics-tracking at the start
- better-auth
- clerk-auth

#### Phase 4 — Data / mapping / AI
Preferred:
- database-design
- database-schema-designer
- frontend-to-backend-requirements
- api-design-principles
- openai-api
- openai-responses
- ai-sdk
- ai-sdk-ui

Do not use:
- frontend-design unless the current step is a UI polish pass
- canvas-design unless the current step is editor-facing

#### Phase 5 — Admin / dashboards / operations
Preferred:
- tanstack-table
- analytics-tracking
- database-design
- api-design-principles

Do not use:
- tiptap
- canvas-design

#### Phase 6 — Review / tests / completion
Preferred:
- requesting-code-review
- verification-before-completion
- web-design-guidelines
- playwright-local
- vitest
- qa-test-planner

Do not use:
- broad architecture skills if the lot is already frozen

### Required behavior at task start
At the start of each task, state:
1. which skills you will use,
2. why,
3. which installed skills you will not use,
4. in which phase each selected skill applies.

If no skill is clearly necessary, use no skill.

### Required behavior during execution
- Use skills phase by phase, not all at once.
- Do not switch skills repeatedly without reason.
- Do not activate design skills during backend-only work.
- Do not activate data/schema skills during pure visual polish.
- Do not activate debugging skills unless a bug or regression exists.
- Do not activate subagent-driven-development unless explicitly requested.

### Completion rule
Before declaring a lot complete:
- run the appropriate verification flow,
- use verification-before-completion when relevant,
- request a code review for important lots,
- keep the used skill set narrow and justified.

