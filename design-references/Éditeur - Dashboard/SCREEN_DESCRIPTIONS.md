# Lot 4 — Éditeur / Dashboard — Screen Descriptions

## Écrans analysés

- `18_modern_resume_template_editor_interface.png`
- `25_saas_performance_dashboard_overview.png`

---

## `18_modern_resume_template_editor_interface.png`

### 1. Nom du fichier
`18_modern_resume_template_editor_interface.png`

### 2. Type d’écran
Éditeur avancé de template / canvas WYSIWYG avec mapping de données.

### 3. Module applicatif concerné
`features/editor`  
Secondairement : `features/data-mapping`, `features/exports`, `features/ai`.

### 4. Route probable
`/editor/[templateId]`  
ou `/templates/[templateId]/editor`

### 5. Objectif fonctionnel de l’écran
Permettre la création, la modification et la prévisualisation de templates dynamiques — CV, flyers, brochures — avec canvas WYSIWYG, gestion des pages, calques, variables, presets, mapping de données, répétiteurs/listes et graphiques dynamiques.

### 6. Layout général
- Interface studio complète avec topbar sombre.
- Sidebar verticale gauche pour les grands modules de l’éditeur.
- Panneau gauche de données/presets.
- Zone centrale canvas avec page A4, règles, marges, guides et sélection active.
- Barre d’outils verticale flottante à gauche du canvas.
- Panneau droit d’inspection avec onglets style/texte/données/effets.
- Panneau calques à l’extrême droite.
- Panneau inférieur de mapping des données.
- Layout très dense, professionnel, orienté logiciel de design.

### 7. Zones principales
- **Topbar globale** :
  - logo Studio Templates
  - actions : Nouveau, Ouvrir, Enregistrer, Exporter, Aperçu
  - undo/redo
  - zoom
  - outils d’affichage
  - sélecteurs responsive/device
  - recherche
  - bouton Partager / Publier
  - aide / notifications
- **Sidebar éditeur** :
  - Données actif
  - Bibliothèques
  - Calques
  - Objets
  - Pages
- **Panneau gauche Données** :
  - onglets Variables / Presets
  - recherche de variables
  - liste de variables typées
  - zone presets avec miniatures
- **Zone canvas** :
  - onglets de pages Cover, Page 2, Page 3
  - règle horizontale et verticale
  - page A4
  - template CV affiché
  - sélection active sur le texte `[Prénom] [Nom]`
  - guides bleus/cyans et marge magenta
  - widget de répétiteur `Expérience`
- **Toolbar verticale canvas** :
  - sélection
  - texte
  - image
  - forme
  - ligne
  - icône
  - tableau
  - graphique
  - dessin libre
  - commentaire
- **Inspector droit** :
  - onglets Style, Texte, Données, Effets
  - réglages typographiques
  - couleur
  - alignement
  - disposition
  - position/taille
  - padding/marges
  - source de données
  - fallback
  - visibilité
- **Panneau calques** :
  - recherche calques
  - arbre Header, Sidebar, Content, Formation, Footer
  - visibilité
  - groupes
  - calque sélectionné
- **Panneau mapping inférieur** :
  - source de données CSV
  - statut connecté
  - aperçu des données
  - mapping des champs
  - répétiteurs/listes
  - graphiques dynamiques

### 8. Composants visibles
- `EditorShell`
- `EditorTopbar`
- `EditorSidebar`
- `DataPanel`
- `VariablesPanel`
- `PresetsPanel`
- `CanvasViewport`
- `PageTabs`
- `CanvasRulers`
- `CanvasGuides`
- `CanvasPage`
- `FloatingCanvasToolbar`
- `InspectorPanel`
- `StyleInspector`
- `TextInspector`
- `DataInspector`
- `EffectsInspector`
- `LayersPanel`
- `LayerTree`
- `BottomDataMappingPanel`
- `DataSourceSelector`
- `DataPreviewTable`
- `FieldMappingTable`
- `RepeatersPanel`
- `DynamicChartsPanel`
- `StatusBar`
- `ZoomControl`
- `DevicePreviewToggle`

### 9. Données affichées
- Variables :
  - `[Nom]` — TEXTE
  - `[Prénom]` — TEXTE
  - `[Poste]` — TEXTE
  - `[Téléphone]` — TEXTE
  - `[Email]` — TEXTE
  - `[Photo]` — IMAGE
  - `[Expérience]` — LISTE
  - `[Compétences]` — LISTE
  - `[Langues]` — TABLE
- Presets :
  - CV Classique
  - CV Créatif
  - Flyer Événement
  - Brochure Entreprise
- Template affiché :
  - photo profil
  - contact
  - compétences
  - langues
  - nom/prénom dynamique
  - poste dynamique
  - expérience professionnelle
  - formation
- Mapping :
  - source : CSV `cv_donnees.csv`
  - statut connecté
  - aperçu : Dupont, Lucas, Directeur Artistique, téléphone
  - mappings :
    - Nom & Prénom → `[Nom] [Prénom]`
    - Poste → `[Poste]`
    - Téléphone → `[Téléphone]`
    - Email → `[Email]`
  - répétiteurs :
    - Experience List — 3 items
    - Compétences — 5 items
    - Langues — 3 items
  - graphique : compétences, type barres horizontales
- Inspector :
  - police Playfair Display
  - Bold
  - taille 48 px
  - couleurs `#0D1B2A`, `#DAAF37`
  - position X/Y
  - dimensions L/H
  - source `[Nom]`
  - fallback `Prénom Nom`
  - visibilité toujours visible

### 10. Actions utilisateur visibles
- Créer un nouveau document.
- Ouvrir un template.
- Enregistrer.
- Exporter.
- Lancer l’aperçu.
- Annuler/rétablir.
- Modifier le zoom.
- Rechercher.
- Partager/publier.
- Changer de page.
- Ajouter une page.
- Sélectionner un objet canvas.
- Ajouter texte, image, forme, ligne, icône, tableau, graphique ou dessin.
- Modifier style, texte, données et effets.
- Choisir une source de données.
- Mapper les champs.
- Configurer répétiteurs/listes.
- Configurer graphiques.
- Afficher/masquer marges.
- Activer/désactiver magnétisme.
- Gérer les calques.
- Ajouter une règle de visibilité.

### 11. États UI visibles
- Module `Données` actif dans la sidebar.
- Onglet `Variables` actif.
- Page `Cover` active.
- Objet texte `[Prénom] [Nom]` sélectionné avec bounding box bleue.
- Onglet `Style` actif dans l’inspector.
- Calque `Nom & Prénom` sélectionné dans les calques.
- Source CSV connectée avec indicateur vert.
- Marges affichées.
- Magnétisme activé.
- Zoom à 85%.
- Guides visibles sur le canvas.
- Document page `1 / 3`.

### 12. Composants à créer ou réutiliser
À réutiliser :
- `AppShell` ou `StudioShell`
- `Topbar`
- `Sidebar`
- `Button`
- `Tabs`
- `Select`
- `Input`
- `StatusBadge`
- `DataTable`
- `ResizablePanelGroup`

À créer :
- `EditorPage`
- `EditorShell`
- `EditorTopbar`
- `EditorLeftRail`
- `EditorDataPanel`
- `VariablesPanel`
- `PresetsPanel`
- `CanvasViewport`
- `KonvaCanvasRenderer`
- `CanvasPageFrame`
- `CanvasRulers`
- `CanvasGuides`
- `CanvasSelectionOverlay`
- `CanvasFloatingToolbar`
- `InspectorPanel`
- `TextStyleControls`
- `LayoutControls`
- `DataBindingControls`
- `LayersPanel`
- `LayerTree`
- `BottomMappingDrawer`
- `DataSourcePreview`
- `FieldMappingGrid`
- `RepeaterMappingPanel`
- `ChartMappingPanel`
- `EditorStatusBar`

### 13. Contraintes de fidélité visuelle
- Cet écran est le **cœur absolu du produit**.
- Ne pas simplifier l’éditeur en une page statique.
- Respecter le layout multi-panneaux :
  - sidebar gauche,
  - panneau données,
  - canvas central,
  - inspector droit,
  - calques,
  - panneau mapping inférieur.
- Le canvas doit être basé sur `Konva` / `react-konva`.
- Le canvas ne doit pas être la source de vérité métier.
- Le rendu doit préparer le pipeline :
  - `Template Schema -> Binding Engine -> Layout Engine -> Canonical Render Tree -> Renderers`.
- Les variables, répétiteurs, mapping et calques doivent être traités comme des fonctionnalités centrales.
- Le style doit rester très proche d’un logiciel professionnel de design/template.
- Les règles, guides, marges, magnétisme et sélection doivent être visibles.
- Ne pas supprimer l’inspector ni le panneau inférieur de mapping.
- Ne pas remplacer les calques par une simple liste plate.

### 14. Points d’ambiguïté
- L’image montre l’écran final riche ; l’implémentation doit probablement se faire par lots.
- Les interactions exactes des outils canvas ne sont pas toutes visibles.
- Le moteur de layout/export n’est pas visible mais doit être prévu par l’architecture.
- Le panneau IA n’est pas visible ici, mais l’intégration IA par champ doit rester compatible.
- Les exports PDF/HTML/PNG/JPEG/PPTX ne sont pas visibles dans ce screenshot, mais le bouton Exporter impose un pipeline d’export.
- Les graphiques dynamiques sont visibles en panneau mapping, mais leur rendu final dans le template n’est pas montré.

### 15. Priorité d’implémentation
**P0** — écran le plus prioritaire du produit.  
À implémenter avant les modules satellites.

---

## `25_saas_performance_dashboard_overview.png`

### 1. Nom du fichier
`25_saas_performance_dashboard_overview.png`

### 2. Type d’écran
Dashboard global de performance et d’activité de la plateforme.

### 3. Module applicatif concerné
`features/dashboard` ou dashboard transverse.  
Secondairement : `features/admin`, `features/candidates`, `features/payments`, `features/ai`, `features/notifications`.

### 4. Route probable
`/dashboard`

### 5. Objectif fonctionnel de l’écran
Fournir une vue d’ensemble des performances de la plateforme : templates, candidats, utilisateurs, workflows, revenus, santé système, objectifs, tâches, alertes, activité IA, règlements et entretiens.

### 6. Layout général
- Shell global Studio Templates.
- Sidebar sombre avec `Tableau de bord` actif.
- Topbar sombre identique à l’application.
- Main content organisé en dashboard dense :
  - header,
  - KPI row,
  - graphiques principaux,
  - cards analytiques,
  - colonne droite d’insights.
- Layout en grille avec cards blanches, accent violet, statuts colorés.

### 7. Zones principales
- **Header** :
  - titre `Dashboard`
  - sous-titre : vue d’ensemble activité/performance/opérations.
- **KPI row** :
  - templates publiés
  - candidats actifs
  - utilisateurs actifs
  - workflows exécutés
  - revenus mensuels
  - score santé plateforme
- **Graphiques principaux** :
  - activité sur 30 jours
  - répartition des usages
- **Cards opérationnelles** :
  - pipeline candidats
  - templates les plus utilisés
  - tâches à traiter
  - activité récente
  - performance IA
  - règlements récents
- **Right panel** :
  - santé du système
  - objectifs du mois
  - actions rapides
  - alertes
  - entretiens à venir

### 8. Composants visibles
- `DashboardPage`
- `AppShell`
- `Topbar`
- `Sidebar`
- `PageHeader`
- `KpiCard`
- `LineChartCard`
- `DonutChartCard`
- `PipelineSummaryCard`
- `TopTemplatesTableCard`
- `TasksCard`
- `RecentActivityTimeline`
- `AiPerformanceCard`
- `RecentPaymentsTable`
- `SystemHealthPanel`
- `MonthlyGoalsPanel`
- `QuickActionsPanel`
- `AlertsPanel`
- `UpcomingInterviewsPanel`
- `ProgressBar`
- `StatusBadge`

### 9. Données affichées
- KPI :
  - Templates publiés : `248`
  - Candidats actifs : `1 284`
  - Utilisateurs actifs : `128`
  - Workflows exécutés : `8 420`
  - Revenus mensuels : `24 580 €`
  - Score santé plateforme : `98%`
- Activité sur 30 jours :
  - courbe d’activités totales
  - période affichée de fin avril à fin mai
  - filtre `30 derniers jours`
- Répartition des usages :
  - total `12 456` actions totales
  - Templates 40%
  - Recrutement 25%
  - IA 15%
  - Automatisation 12%
  - Paiements 8%
- Pipeline candidats :
  - Nouveau 532
  - Pré-qualifié 318
  - Entretien 164
  - Offre 87
  - Embauché 53
  - taux conversion global 16,4%
- Templates les plus utilisés :
  - Offre d’emploi — Développeur
  - Entretien technique
  - Email de suivi candidat
  - Onboarding collaborateur
  - Contrat de travail CDI
- Tâches à traiter :
  - valider les nouveaux tags
  - entretien Paul Lambert
  - sauvegarde à vérifier
  - paiement à relancer
- Activité récente :
  - template publié
  - utilisateur invité
  - paiement reçu
  - traitement IA terminé
  - webhook échoué
- Performance IA :
  - tokens consommés `2,45 M`
  - coût mensuel `346,80 €`
  - prompts exécutés `8 732`
- Règlements récents :
  - factures ST-2024-044 à ST-2024-041
  - clients Acme Corp, TechNova, Vision Plus, DataFlow
  - statuts payée/en attente
- Santé système :
  - base de données PostgreSQL 14
  - serveur mail SMTP SendGrid
  - API REST
  - LLM & IA OpenAI/Anthropic
  - paiements Stripe
- Objectifs du mois :
  - templates publiés
  - candidats actifs
  - chiffre d’affaires
  - activation utilisateurs
- Alertes :
  - webhook échoué
  - paiement en attente
  - sauvegarde à vérifier
- Entretiens :
  - Paul Lambert
  - Emma Rousseau
  - Thomas Girard

### 10. Actions utilisateur visibles
- Naviguer via sidebar.
- Changer période d’activité.
- Voir le détail des usages.
- Voir tout le pipeline.
- Voir tous les templates.
- Voir toutes les tâches.
- Voir détail performance IA.
- Voir tous les règlements.
- Voir détail santé système.
- Voir tous les objectifs.
- Créer un template.
- Inviter un utilisateur.
- Lancer un workflow.
- Exporter le rapport.
- Voir toutes les alertes.
- Voir tous les entretiens.

### 11. États UI visibles
- Sidebar `Tableau de bord` active en violet.
- Indicateurs de tendance verts sur les KPI.
- Score santé `Excellente santé` en badge vert.
- Système opérationnel avec statuts verts.
- Alertes rouges/oranges.
- Objectifs affichés avec progress bars violettes.
- Graphiques en violet/bleu/vert/orange/rose.
- Cards blanches avec bordures fines et coins arrondis.
- Boutons rapides sous forme de cards.

### 12. Composants à créer ou réutiliser
À réutiliser :
- `AppShell`
- `Topbar`
- `Sidebar`
- `PageHeader`
- `KpiCard`
- `SectionCard`
- `StatusBadge`
- `ProgressBar`
- `DataTable`
- `RightInsightPanel`
- `QuickActionList`

À créer :
- `DashboardPage`
- `DashboardKpiGrid`
- `ActivityLineChart`
- `UsageDonutChart`
- `CandidatePipelineSummary`
- `TopTemplatesCard`
- `TasksToProcessCard`
- `RecentActivityCard`
- `AiPerformanceCard`
- `RecentPaymentsCard`
- `SystemHealthSummaryPanel`
- `MonthlyObjectivesPanel`
- `DashboardAlertsPanel`
- `UpcomingInterviewsPanel`

### 13. Contraintes de fidélité visuelle
- Le dashboard doit rester dense mais lisible.
- Conserver la colonne droite d’insights.
- Les KPI doivent rester en rangée haute.
- Les graphiques doivent utiliser `visx`, pas Recharts.
- Ne pas remplacer les graphiques par de simples tableaux.
- Les actions rapides doivent rester sous forme de cards.
- Le shell doit être cohérent avec les autres écrans Studio Templates.
- Conserver les couleurs d’état : vert succès, orange attention, rouge erreur, violet action.

### 14. Points d’ambiguïté
- Le dashboard est transverse ; il peut vivre dans `app/dashboard` avec composants partagés plutôt que dans une feature unique.
- Certains modules affichés dépendent de features non encore implémentées.
- Les données sont probablement mockées en V1.
- Les graphiques miniatures de performance IA doivent être construits avec `visx` ou simplifiés dans une première itération sans casser la structure.

### 15. Priorité d’implémentation
**P1** — dashboard global important, mais après la fondation du shell et idéalement après le socle éditeur.  
L’écran éditeur `18_modern_resume_template_editor_interface.png` reste prioritaire en **P0**.

---

# Synthèse globale du lot

## Mapping écran → route → feature

| Image | Route recommandée | Feature principale | Features secondaires | Priorité |
|---|---|---|---|---|
| `18_modern_resume_template_editor_interface.png` | `/editor/[templateId]` ou `/templates/[templateId]/editor` | `features/editor` | `features/data-mapping`, `features/exports`, `features/ai` | P0 |
| `25_saas_performance_dashboard_overview.png` | `/dashboard` | dashboard transverse | `features/admin`, `features/candidates`, `features/payments`, `features/ai`, `features/notifications` | P1 |

---

# Routes recommandées

```txt
/dashboard
/editor/[templateId]
/templates/[templateId]/editor