# Lot 5 — Users / Tags — Screen Descriptions

## Écrans analysés

- `01_admin_dashboard_for_user_management.png`
- `10_candidate_profile_with_tag_management_interface.png`
- `19_modern_saas_dashboard_for_tag_management.png`
- `26_saas_tag_management_dashboard_interface.png`
- `27_tag_selector_for_candidate_profile.png`
- `28_tag_selector_in_recruitment_app.png`
- `29_user_management_admin_dashboard_interface.png`
- `30_user_profile_in_studio_templates_dashboard.png`

---

## `01_admin_dashboard_for_user_management.png`

### 1. Nom du fichier
`01_admin_dashboard_for_user_management.png`

### 2. Type d’écran
Administration des utilisateurs, rôles, permissions, invitations et sécurité d’accès.

### 3. Module applicatif concerné
`features/admin`  
Secondairement : `features/users`, `features/auth`, `features/notifications`.

### 4. Route probable
`/admin/users`  
ou `/users`

### 5. Objectif fonctionnel de l’écran
Permettre à l’administrateur de gérer les comptes utilisateurs, les rôles, les invitations, les permissions, les paramètres de sécurité et les alertes d’accès.

### 6. Layout général
- Shell global Studio Templates avec topbar sombre et sidebar gauche.
- Page principale en contenu clair.
- Header `Utilisateurs & rôles`.
- KPI cards en haut.
- Table utilisateurs au centre.
- Matrice de permissions et paramètres de sécurité en bas.
- Colonne droite dédiée aux invitations en attente et alertes de sécurité.

### 7. Zones principales
- Topbar :
  - Nouveau
  - Ouvrir
  - Enregistrer
  - Exporter
  - Aperçu
  - zoom
  - recherche
  - partage/publication
- Sidebar :
  - Administration actif
- Header :
  - titre `Utilisateurs & rôles`
  - sous-titre sur comptes, permissions, sécurité et invitations.
- KPI :
  - Utilisateurs
  - Administrateurs
  - Invitations en attente
  - 2FA activée
- Table utilisateurs :
  - recherche
  - filtres rôle, équipe, statut
  - bouton filtrer
  - bouton exporter
  - colonnes utilisateur, email, rôle, équipe, statut, dernière connexion, actions
- Bas de page :
  - matrice des permissions par rôle
  - paramètres de sécurité
- Right rail :
  - bouton `Inviter un utilisateur`
  - invitations en attente
  - alertes de sécurité récentes

### 8. Composants visibles
- `AppShell`
- `Topbar`
- `Sidebar`
- `PageHeader`
- `KpiCard`
- `UsersTable`
- `UserAvatar`
- `RoleBadge`
- `StatusBadge`
- `FilterBar`
- `PermissionMatrix`
- `SecuritySettingsCard`
- `PendingInvitationsPanel`
- `SecurityAlertsPanel`
- `Button`
- `Pagination`
- `ActionMenu`

### 9. Données affichées
- KPI :
  - Utilisateurs : `128`
  - Administrateurs : `12`
  - Invitations en attente : `8`
  - 2FA activée : `86%`
- Utilisateurs :
  - Lucas Dupont — Administrateur — Direction — Actif
  - Sophie Martin — Manager — Recrutement — Actif
  - Thomas Bernard — Recruteur — Recrutement — Actif
  - Chloé Petit — Éditeur — Marketing — Actif
  - Julien Moreau — Éditeur — Marketing — Inactif
  - Camille Richard — Recruteur — Recrutement — Actif
  - Antoine Lefevre — Manager — Opérations — Actif
- Rôles de la matrice :
  - Administrateur
  - Manager
  - Recruteur
  - Éditeur
- Permissions :
  - Lecture
  - Écriture
  - Export
  - Gestion IA
  - Paiement
  - Administration
- Sécurité :
  - SSO activé Google Workspace
  - 2FA obligatoire
  - durée de session 8 heures d’inactivité
  - politique mot de passe 12 caractères minimum
  - IP autorisées
- Invitations :
  - Marie Lemoine
  - Paul Girard
  - Inès Chevalier
  - Nicolas Faure
- Alertes :
  - connexion depuis un nouvel appareil
  - échecs de connexion répétés
  - changement de rôle

### 10. Actions utilisateur visibles
- Inviter un utilisateur.
- Rechercher un utilisateur.
- Filtrer par rôle, équipe, statut.
- Exporter la liste.
- Ouvrir le menu actions d’un utilisateur.
- Modifier une permission dans la matrice.
- Modifier les paramètres de sécurité.
- Voir toutes les invitations.
- Voir toutes les alertes de sécurité.

### 11. États UI visibles
- Sidebar `Administration` active.
- Badges rôles colorés.
- Badges statut `Actif` / `Inactif`.
- 2FA activée avec indicateur vert.
- Invitations en attente avec rôle associé.
- Alertes sécurité avec indicateurs rouge/orange.
- Pagination active.
- Cards blanches arrondies.

### 12. Composants à créer ou réutiliser
À réutiliser :
- `AppShell`
- `Topbar`
- `Sidebar`
- `PageHeader`
- `KpiCard`
- `StatusBadge`
- `DataTable`
- `RightInsightPanel`
- `ActionMenu`
- `Button`

À créer :
- `AdminUsersRolesPage`
- `UsersRolesKpiGrid`
- `UsersTable`
- `UserRoleBadge`
- `PermissionMatrix`
- `SecuritySettingsCard`
- `PendingInvitationsPanel`
- `SecurityAlertsPanel`
- `InviteUserButton`

### 13. Contraintes de fidélité visuelle
- Conserver la table utilisateurs comme élément central.
- Conserver la matrice de permissions en bas.
- Conserver le right rail avec invitations et alertes.
- Les rôles doivent rester visibles sous forme de badges.
- La sécurité ne doit pas être réduite à une simple liste.
- Ne pas fusionner invitations et utilisateurs dans la même table.

### 14. Points d’ambiguïté
- La route peut être `/admin/users` ou `/users`; l’écran est clairement admin, recommandation : `/admin/users`.
- Les actions de modification des permissions ne sont pas visibles en détail.
- L’invitation utilisateur peut ouvrir une modal non visible.
- La gestion réelle des rôles doit être alignée avec Better Auth.

### 15. Priorité d’implémentation
**P1** — écran important de gouvernance utilisateurs/rôles, après le shell global et les fondations auth.

---

## `10_candidate_profile_with_tag_management_interface.png`

### 1. Nom du fichier
`10_candidate_profile_with_tag_management_interface.png`

### 2. Type d’écran
Fiche candidat avec modal simple d’ajout de tags.

### 3. Module applicatif concerné
`features/candidates`  
Secondairement : `features/tags`.

### 4. Route probable
`/candidates/[candidateId]` avec modal `AddTagsDialog`

### 5. Objectif fonctionnel de l’écran
Permettre d’ajouter rapidement des tags à un profil candidat depuis la fiche candidat, via une modal compacte.

### 6. Layout général
- Shell global en arrière-plan.
- Fiche candidat visible en arrière-plan avec overlay grisé.
- Modal centrée de taille moyenne.
- La modal contient :
  - titre,
  - recherche,
  - liste de tags disponibles,
  - tags sélectionnés,
  - champ nouveau tag,
  - actions annuler / ajouter.
- Right rail candidat visible en arrière-plan mais désactivé par l’overlay.

### 7. Zones principales
- Arrière-plan :
  - fiche Emma Laurent
  - résumé profil
  - formations
  - langues
  - documents
  - disponibilité
  - right rail matching/statut/tags/radar
- Modal :
  - header `Ajouter des tags`
  - bouton fermer
  - search input
  - liste de tags disponibles :
    - Leadership
    - Communication
    - Gestion d’équipe
    - SaaS
    - Anglais C1
    - Ressources humaines
  - section tags sélectionnés
  - champ `Nouveau tag...`
  - boutons `Annuler` et `Ajouter`

### 8. Composants visibles
- `CandidateProfilePage`
- `ModalOverlay`
- `AddTagsDialog`
- `SearchInput`
- `AvailableTagList`
- `TagRow`
- `TagChip`
- `Button`
- `IconButton`
- `CandidateTagsPanel`

### 9. Données affichées
- Candidat :
  - Emma Laurent
  - Responsable Talent
  - statut disponible
  - matching global 86%
- Tags disponibles :
  - Leadership
  - Communication
  - Gestion d’équipe
  - SaaS
  - Anglais C1
  - Ressources humaines
- Tags sélectionnés :
  - Leadership
  - Communication
  - Gestion d’équipe
- Actions :
  - ajouter chaque tag via bouton `+`
  - supprimer tag sélectionné via croix
  - ajouter un nouveau tag

### 10. Actions utilisateur visibles
- Rechercher un tag.
- Ajouter un tag depuis la liste.
- Retirer un tag sélectionné.
- Saisir un nouveau tag.
- Annuler.
- Valider l’ajout des tags.
- Fermer la modal.

### 11. États UI visibles
- Overlay sombre sur la fiche candidat.
- Modal active au centre.
- Tags sélectionnés visibles en chips violettes.
- Bouton principal `Ajouter` en violet.
- Bouton secondaire `Annuler`.
- Liste disponible avec boutons plus.
- Arrière-plan désactivé visuellement.

### 12. Composants à créer ou réutiliser
À réutiliser :
- `CandidateProfilePage`
- `TagChip`
- `SearchInput`
- `Button`
- `Dialog`

À créer :
- `AddTagsDialog`
- `AvailableTagList`
- `SelectedTagsList`
- `NewTagInlineInput`

### 13. Contraintes de fidélité visuelle
- La modal doit rester simple, compacte et centrée.
- Le fond doit être grisé avec la fiche visible.
- Les tags sélectionnés doivent être séparés de la liste disponible.
- Chaque tag disponible doit avoir un bouton `+`.
- Ne pas remplacer cette modal par une page dédiée.

### 14. Points d’ambiguïté
- Ce sélecteur est une version simple ; d’autres captures montrent une version beaucoup plus avancée du sélecteur de tags.
- Le nouveau tag saisi ici peut nécessiter une validation admin, mais ce n’est pas explicite dans cette modal.
- L’écran de fond semble être une variante simplifiée de la fiche candidat.

### 15. Priorité d’implémentation
**P1** — composant utile, mais il faut privilégier la version avancée si un seul sélecteur doit être retenu.

---

## `19_modern_saas_dashboard_for_tag_management.png`

### 1. Nom du fichier
`19_modern_saas_dashboard_for_tag_management.png`

### 2. Type d’écran
Dashboard de gestion des tags avec validation des demandes.

### 3. Module applicatif concerné
`features/tags`  
Secondairement : `features/admin`.

### 4. Route probable
`/admin/tags`  
ou `/tags`

### 5. Objectif fonctionnel de l’écran
Organiser, rechercher, filtrer, exporter, créer et valider les tags utilisés pour structurer les données de la plateforme.

### 6. Layout général
- Shell global Studio Templates.
- Sidebar avec `Candidats` actif, même si breadcrumb indique Administration / Tags.
- Header `Gestion des tags`.
- KPI cards en haut.
- Table centrale de tags avec filtres.
- Right rail de demandes à valider.
- Cards analytiques en bas.

### 7. Zones principales
- Header :
  - breadcrumb Administration / Tags
  - titre `Gestion des tags`
  - sous-titre
  - bouton `Nouveau tag`
  - bouton `Exporter`
- KPI :
  - Total
  - En attente
  - Publics
  - Privés
- Filtres :
  - recherche tag
  - catégorie
  - statut
  - visibilité
  - filtres avancés
- Table :
  - tag
  - catégorie
  - type
  - visibilité
  - statut
  - utilisation
  - actions
- Right rail :
  - demandes à valider
  - cartes de demandes avec valider/refuser
- Bas de page :
  - taxonomie des tags
  - tags les plus utilisés

### 8. Composants visibles
- `TagManagementPage`
- `KpiCard`
- `TagFilterBar`
- `TagsTable`
- `TagChip`
- `CategoryBadge`
- `StatusBadge`
- `VisibilityBadge`
- `UsageBar`
- `ValidationRequestsPanel`
- `TagTaxonomyCard`
- `TopTagsUsageCard`
- `Pagination`
- `Button`

### 9. Données affichées
- KPI :
  - Total `1 248`
  - En attente `23`
  - Publics `892`
  - Privés `356`
- Tags :
  - Leadership
  - Python
  - Data Science
  - Management de projet
  - Anglais courant
  - Paris
  - Kubernetes
  - Communication
- Catégories :
  - Soft skill
  - Outil
  - Métier
  - Langue
  - Localisation
- Types :
  - Compétence
  - Domaine
  - Niveau
  - Localisation
- Visibilité :
  - Public
  - Privé
- Statuts :
  - Validé
  - En attente
- Demandes :
  - Prompt Engineering
  - Gestion du changement
  - Canton de Vaud
- Taxonomie :
  - Compétence
  - Soft skill
  - Outil
  - Métier
  - Domaine
  - Langue
  - Localisation
  - Autres
- Tags les plus utilisés :
  - Leadership
  - Python
  - Communication
  - Data Science
  - Management de projet

### 10. Actions utilisateur visibles
- Créer un nouveau tag.
- Exporter.
- Rechercher un tag.
- Filtrer par catégorie, statut, visibilité.
- Ouvrir filtres avancés.
- Sélectionner des lignes.
- Ouvrir menu actions d’un tag.
- Paginer.
- Valider une demande.
- Refuser une demande.
- Voir toutes les demandes.
- Voir tout / voir rapport.

### 11. États UI visibles
- Badges colorés par catégorie.
- Statuts validé/en attente.
- Visibilité public/privé avec icône.
- Utilisation affichée avec barre de progression.
- Right rail avec demandes à valider.
- Boutons valider violet et refuser rouge/outline.
- Pagination active.

### 12. Composants à créer ou réutiliser
À réutiliser :
- `AppShell`
- `PageHeader`
- `KpiCard`
- `DataTable`
- `StatusBadge`
- `TagChip`
- `RightInsightPanel`
- `Button`

À créer :
- `TagManagementPage`
- `TagKpiGrid`
- `TagFilterBar`
- `TagsTable`
- `TagUsageBar`
- `TagValidationRequestsPanel`
- `TagValidationRequestCard`
- `TagTaxonomyCard`
- `TopTagsUsageCard`

### 13. Contraintes de fidélité visuelle
- La table doit rester centrale.
- Le right rail de validation doit rester visible.
- Les badges de catégorie doivent être colorés.
- La colonne utilisation doit afficher une barre.
- Les demandes à valider doivent garder les boutons `Valider` / `Refuser`.
- Ne pas transformer la taxonomie en simple texte.

### 14. Points d’ambiguïté
- La sidebar active est `Candidats`, mais l’écran semble administratif. La route recommandée est `/admin/tags`.
- Certains tags peuvent être globaux ou spécifiques au module candidat.
- Le comportement de `Nouveau tag` n’est pas visible.

### 15. Priorité d’implémentation
**P1** — important pour gouvernance des tags et cohérence du profil candidat.

---

## `26_saas_tag_management_dashboard_interface.png`

### 1. Nom du fichier
`26_saas_tag_management_dashboard_interface.png`

### 2. Type d’écran
Gestionnaire avancé de tags avec gouvernance, validation, conflits et analytics.

### 3. Module applicatif concerné
`features/tags`  
Secondairement : `features/admin`.

### 4. Route probable
`/admin/tags`

### 5. Objectif fonctionnel de l’écran
Fournir une gouvernance centralisée complète des tags : création, validation, classification, usage, conflits, fusion, désactivation et suivi analytique.

### 6. Layout général
- Shell global.
- Header `Gestionnaire de tags`.
- KPI row plus complète que l’écran précédent.
- Table centrale très détaillée.
- Right rail avec demandes utilisateurs.
- Cards analytiques en bas :
  - taxonomie,
  - activité validation,
  - répartition par catégorie,
  - top 10 usage.

### 7. Zones principales
- Header :
  - breadcrumb Administration / Gestion des tags
  - titre `Gestionnaire de tags`
  - sous-titre gouvernance centralisée
  - boutons `Nouveau tag`, `Exporter`
- KPI :
  - total tags
  - en attente validation
  - tags publics
  - tags privés
  - désactivés
  - doublons/conflits
- Filtres :
  - recherche tag/synonyme/ID
  - catégorie
  - type
  - visibilité
  - statut
  - propriétaire
  - validation
  - usage
  - réinitialiser
  - filtres avancés
- Table :
  - tag
  - catégorie
  - type
  - visibilité
  - statut
  - créé par
  - source
  - utilisation
  - demandes
  - dernière mise à jour
  - actions
- Right rail :
  - demandes utilisateurs
  - validation/refus/fusion
- Bas :
  - taxonomie
  - activité validation récente
  - donut répartition catégorie
  - top 10 tags

### 8. Composants visibles
- `AdvancedTagManagerPage`
- `TagKpiGrid`
- `TagAdvancedFilterBar`
- `AdvancedTagsTable`
- `TagChip`
- `CategoryBadge`
- `StatusBadge`
- `VisibilityBadge`
- `Sparkline`
- `UserAvatar`
- `ValidationRequestsPanel`
- `ValidationActivityTable`
- `TaxonomyTreeCard`
- `CategoryDistributionChart`
- `TopTagsBarList`
- `Pagination`
- `ActionMenu`

### 9. Données affichées
- KPI :
  - Total des tags : `1 248`
  - En attente de validation : `23`
  - Tags publics : `892`
  - Tags privés : `356`
  - Désactivés : `38`
  - Doublons / conflits : `12`
- Tags table :
  - Leadership
  - Python
  - Data Science
  - Management de projet
  - Anglais courant
  - Paris
  - Kubernetes
  - Communication
  - DevOps
  - React.js
- Statuts :
  - Validé
  - Candidat
  - En attente
  - Fusion suggérée
  - Désactivé
- Sources :
  - Manuel
  - Import RH
  - Import ATS
  - Import SIRH
  - Détection auto
- Right rail demandes :
  - Prompt Engineering
  - Gestion du changement
  - Canton de Vaud
- Actions demandes :
  - valider
  - refuser
  - fusionner
- Analytics :
  - taxonomie avec catégories et volumes
  - activité validation
  - donut total 1 248
  - top 10 tags les plus utilisés

### 10. Actions utilisateur visibles
- Créer un nouveau tag.
- Exporter.
- Rechercher par tag, synonyme ou ID.
- Filtrer par multiples critères.
- Réinitialiser les filtres.
- Ouvrir filtres avancés.
- Sélectionner lignes.
- Ouvrir menu actions.
- Paginer.
- Valider/refuser/fusionner une demande utilisateur.
- Voir toutes les demandes.
- Développer la taxonomie.
- Voir toute l’activité.
- Voir le rapport complet.

### 11. États UI visibles
- Sidebar `Candidats` active malgré le contexte administration.
- Badges de statuts multiples.
- Donut chart par catégorie.
- Sparklines dans la colonne utilisation.
- Right rail plus détaillé que l’écran 19.
- Boutons validation/refus/fusion.
- Pagination active.
- Filtres très nombreux.

### 12. Composants à créer ou réutiliser
À réutiliser :
- `AppShell`
- `KpiCard`
- `DataTable`
- `StatusBadge`
- `TagChip`
- `RightInsightPanel`
- `Button`

À créer :
- `AdvancedTagManagerPage`
- `AdvancedTagFilterBar`
- `AdvancedTagsTable`
- `TagStatusBadge`
- `TagVisibilityBadge`
- `TagUsageSparkline`
- `UserTagRequestCard`
- `TagTaxonomyTree`
- `ValidationActivityCard`
- `TagCategoryDonutChart`
- `TopTagsUsageRanking`

### 13. Contraintes de fidélité visuelle
- Cette version est plus complète que `19_modern_saas_dashboard_for_tag_management.png`.
- À privilégier comme référence principale pour l’écran `/admin/tags`.
- Conserver les filtres avancés.
- Conserver les colonnes détaillées de la table.
- Conserver les actions `Valider`, `Refuser`, `Fusionner`.
- Conserver les analytics bas de page.
- Utiliser `visx` pour donut/sparklines/barres.

### 14. Points d’ambiguïté
- L’écran 19 est une version plus simple du même domaine ; l’écran 26 doit être considéré comme la version avancée.
- La notion de tags privés/publics doit être précisée dans le modèle de données.
- Les statuts `Candidat`, `Fusion suggérée`, `Désactivé` impliquent un workflow de gouvernance non totalement visible.

### 15. Priorité d’implémentation
**P1** — référence principale pour le gestionnaire global de tags.

---

## `27_tag_selector_for_candidate_profile.png`

### 1. Nom du fichier
`27_tag_selector_for_candidate_profile.png`

### 2. Type d’écran
Modal avancée de sélection de tags pour un profil candidat.

### 3. Module applicatif concerné
`features/tags`  
Secondairement : `features/candidates`.

### 4. Route probable
Composant modal dans `/candidates/[candidateId]`  
Nom logique : `AdvancedTagSelectorDialog`

### 5. Objectif fonctionnel de l’écran
Permettre de rechercher, filtrer, sélectionner, organiser et demander des tags depuis une fiche candidat, avec recommandations contextuelles.

### 6. Layout général
- Fiche candidat en arrière-plan avec overlay grisé.
- Grande modal centrée, plus large que la version simple.
- Header modal avec titre et description.
- Barre de recherche et filtres.
- Tags recommandés en cards horizontales.
- Zone principale en deux colonnes :
  - liste des tags disponibles,
  - tags sélectionnés organisés par catégorie.
- Zone demande de tag.
- Footer avec actions annuler/ajouter.

### 7. Zones principales
- Modal header :
  - titre `Sélecteur de tags`
  - description : ajouter des tags pertinents au profil d’Emma
  - bouton fermer
- Filtres :
  - recherche
  - catégorie
  - statut
  - visibilité
- Recommandés :
  - Leadership
  - Gestion d’équipe
  - Sourcing expert
  - SaaS
  - Anglais C1
- Tags disponibles :
  - table simple avec tag, catégorie, statut, bouton +
- Tags sélectionnés :
  - Soft skills
  - Métier
  - Langues
  - Secteurs
- Demander un tag :
  - champ nom du tag demandé
  - bouton envoyer
- Footer :
  - annuler
  - ajouter les tags

### 8. Composants visibles
- `AdvancedTagSelectorDialog`
- `ModalOverlay`
- `SearchInput`
- `SelectField`
- `RecommendedTagCard`
- `AvailableTagsList`
- `SelectedTagsByCategory`
- `TagChip`
- `TagRequestForm`
- `Button`
- `Pagination`

### 9. Données affichées
- Recommandés :
  - Leadership — Soft skill
  - Gestion d’équipe — Soft skill
  - Sourcing expert — Métier
  - SaaS — Secteur
  - Anglais C1 — Langue
- Tags disponibles :
  - Management de projet — Compétence — Validé
  - Communication — Soft skill — Validé
  - Data Analytics — Compétence technique — En attente
  - RH stratégique — Métier — Validé
  - Change management — Compétence — En attente
  - Power BI — Compétence technique — Validé
  - Allemand B2 — Langue — En attente
  - Droit social — Métier — Validé
- Tags sélectionnés :
  - Leadership
  - Communication
  - Gestion d’équipe
  - Sourcing expert
  - RH stratégique
  - Gestion de projet
  - Anglais C1
  - Français
  - SaaS
  - Tech

### 10. Actions utilisateur visibles
- Rechercher un tag.
- Filtrer par catégorie/statut/visibilité.
- Ajouter un tag recommandé.
- Ajouter un tag disponible.
- Retirer un tag sélectionné.
- Déplier/replier catégories sélectionnées.
- Demander un nouveau tag.
- Envoyer la demande.
- Annuler.
- Ajouter les tags sélectionnés.
- Paginer.

### 11. États UI visibles
- Overlay grisé.
- Modal active.
- Recommandations visibles en haut.
- Tags sélectionnés groupés par catégorie.
- Badges statut `Validé` et `En attente`.
- Bouton principal violet.
- Tags avec croix de suppression.
- Pagination dans la liste disponible.

### 12. Composants à créer ou réutiliser
À réutiliser :
- `Dialog`
- `SearchInput`
- `SelectField`
- `TagChip`
- `Button`
- `StatusBadge`

À créer :
- `AdvancedTagSelectorDialog`
- `RecommendedTagCards`
- `AvailableTagsTable`
- `SelectedTagsByCategoryPanel`
- `TagRequestInlineForm`
- `TagSelectorFilters`

### 13. Contraintes de fidélité visuelle
- Modal large, pas une petite popup.
- Les recommandations doivent rester en cards horizontales.
- Les tags sélectionnés doivent être groupés par catégorie.
- La demande de nouveau tag doit rester intégrée.
- Ne pas réduire à un simple multiselect.
- Respecter l’arrière-plan candidat flouté/grisé.

### 14. Points d’ambiguïté
- Cette version est avancée, mais `28_tag_selector_in_recruitment_app.png` est encore plus complète ; choisir la meilleure selon le besoin.
- Certains tags disponibles sont en attente, mais peuvent quand même être affichés.
- La validation admin de nouveaux tags n’est pas visible dans cette modal.

### 15. Priorité d’implémentation
**P1** — composant clé pour la fiche candidat et la gouvernance des tags.

---

## `28_tag_selector_in_recruitment_app.png`

### 1. Nom du fichier
`28_tag_selector_in_recruitment_app.png`

### 2. Type d’écran
Sélecteur de tags avancé complet, avec navigation, recommandations, filtres, liste structurée, sélection organisée et demande de nouveau tag.

### 3. Module applicatif concerné
`features/tags`  
Secondairement : `features/candidates`.

### 4. Route probable
Composant modal dans `/candidates/[candidateId]`  
Nom logique : `TagSelectorDialog`

### 5. Objectif fonctionnel de l’écran
Offrir une expérience complète de sélection de tags pour les profils candidats : recommandations intelligentes, navigation par familles, recherche, filtres, tags sélectionnés organisés, demande de nouveau tag et validation de la sélection.

### 6. Layout général
- Grande modal centrée sur fond candidat grisé.
- Header avec titre et description.
- Barre de recherche large.
- Filtres catégorie/type/visibilité/statut/plus de filtres.
- Onglets horizontaux rapides.
- Navigation latérale interne.
- Zone centrale :
  - suggestions intelligentes,
  - résultats de recherche/table.
- Colonne droite :
  - tags sélectionnés par catégorie,
  - demande nouveau tag.
- Footer :
  - raccourci clavier indiqué,
  - compteur de tags sélectionnés,
  - boutons annuler/ajouter.

### 7. Zones principales
- Header :
  - `Sélecteur de tags`
  - description
  - fermeture
- Search / filters :
  - recherche tag
  - catégorie
  - type
  - visibilité
  - statut
  - plus de filtres
- Quick tabs :
  - Recommandés
  - Tous les tags
  - Récents
  - Favoris
  - Par catégorie
  - Demandés par l’équipe
- Navigation interne :
  - recommandés
  - tous les tags
  - récents
  - favoris
  - catégories
  - demandes équipe
- Suggestions intelligentes :
  - Leadership
  - Sourcing expert
  - SaaS
  - Anglais C1
  - Gestion d’équipe
- Résultats :
  - table de tags avec description, catégorie, type, visibilité, statut, utilisé par, action +
- Tags sélectionnés :
  - compétences clés
  - secteurs
  - langues
  - outils & logiciels
- Demande nouveau tag :
  - nom
  - catégorie
  - type
  - description optionnelle
  - bouton soumettre
- Footer :
  - aide raccourci clavier
  - compteur `8 tags sélectionnés`
  - boutons annuler / ajouter les tags

### 8. Composants visibles
- `TagSelectorDialog`
- `ModalOverlay`
- `SearchInput`
- `FilterSelect`
- `QuickFilterTabs`
- `TagSelectorSideNav`
- `SmartSuggestionsCarousel`
- `RecommendedTagCard`
- `TagResultsTable`
- `SelectedTagsPanel`
- `SelectedTagGroup`
- `NewTagRequestForm`
- `Kbd`
- `Button`
- `StatusBadge`
- `Pagination`

### 9. Données affichées
- Suggestions :
  - Leadership — 92% pertinent — utilisé 156 fois
  - Sourcing expert — 89% pertinent — utilisé 98 fois
  - SaaS — 85% pertinent — utilisé 112 fois
  - Anglais C1 — 82% pertinent — utilisé 324 fois
  - Gestion d’équipe — 78% pertinent — utilisé 203 fois
- Résultats :
  - Leadership transformationnel
  - Sourcing expert
  - SaaS
  - Anglais C1
  - Finance d’entreprise
  - Hospitality
- Colonnes :
  - nom du tag
  - catégorie
  - type
  - visibilité
  - statut
  - utilisé par
- Tags sélectionnés :
  - Leadership
  - Sourcing expert
  - Gestion d’équipe
  - Communication
  - SaaS
  - Hospitality
  - Anglais C1
  - LinkedIn Recruiter
- Navigation :
  - tous les tags 1248
  - récents 18
  - favoris 24
  - compétences techniques 342
  - soft skills 156
  - langues 89
  - secteurs 122
  - outils & logiciels 210
  - méthodologies 78
  - certifications 67
  - en attente validation 7
  - mes demandes 3

### 10. Actions utilisateur visibles
- Rechercher.
- Filtrer par catégorie, type, visibilité, statut.
- Ouvrir plus de filtres.
- Changer d’onglet rapide.
- Naviguer par catégorie.
- Ajouter un tag recommandé.
- Ajouter un tag depuis la table.
- Retirer un tag sélectionné.
- Demander un nouveau tag.
- Soumettre une demande.
- Annuler.
- Ajouter les tags.
- Utiliser raccourci clavier `Entrée`.
- Fermer la modal.

### 11. États UI visibles
- Modal large active.
- Onglet `Recommandés` actif.
- Suggestions avec score de pertinence vert.
- Tags sélectionnés organisés par catégories.
- Statuts `Validé` et `En attente`.
- Bouton principal violet.
- Boutons filtres inactifs en outline.
- Fond candidat grisé.
- Compteur `8 tags sélectionnés`.

### 12. Composants à créer ou réutiliser
À réutiliser :
- `Dialog`
- `SearchInput`
- `Select`
- `Button`
- `TagChip`
- `StatusBadge`
- `Kbd`
- `DataTable`

À créer :
- `TagSelectorDialog`
- `TagSelectorQuickTabs`
- `TagSelectorSideNav`
- `SmartTagSuggestions`
- `RecommendedTagCard`
- `TagResultsTable`
- `SelectedTagsPanel`
- `SelectedTagGroup`
- `NewTagRequestForm`
- `TagSelectorFooter`

### 13. Contraintes de fidélité visuelle
- Cet écran doit être la **référence principale** pour le sélecteur de tags avancé.
- Ne pas réduire le sélecteur à un simple dropdown.
- Conserver la navigation interne.
- Conserver les recommandations intelligentes.
- Conserver la colonne droite des tags sélectionnés.
- Conserver le formulaire de demande de tag.
- Conserver l’indication raccourci clavier.
- Les tags doivent être groupés par catégorie.
- La table centrale doit rester lisible et structurée.

### 14. Points d’ambiguïté
- Les suggestions intelligentes peuvent venir de règles, IA ou scoring métier ; la source n’est pas explicitée.
- Certains tags proposés peuvent être validés ou en attente.
- Les raccourcis clavier doivent être alignés avec le futur composant `Kbd`.
- Les filtres exacts `Plus de filtres` ne sont pas détaillés.

### 15. Priorité d’implémentation
**P1** — composant clé pour la qualité de la fiche candidat et l’expérience tag.

---

## `29_user_management_admin_dashboard_interface.png`

### 1. Nom du fichier
`29_user_management_admin_dashboard_interface.png`

### 2. Type d’écran
Gestion des utilisateurs avec rôles, invitations, journal d’activité et répartition par site.

### 3. Module applicatif concerné
`features/users`  
Secondairement : `features/admin`, `features/auth`.

### 4. Route probable
`/users`  
ou `/admin/users`

### 5. Objectif fonctionnel de l’écran
Administrer les comptes, rôles, accès, invitations, activité et répartition des utilisateurs de l’organisation.

### 6. Layout général
- Shell global.
- Sidebar `Utilisateurs` active.
- Header `Gestion des utilisateurs`.
- KPI row.
- Table utilisateurs au centre.
- Right rail rôles & permissions + répartition par site.
- Bottom cards invitations récentes et journal d’activité.

### 7. Zones principales
- Header :
  - titre `Gestion des utilisateurs`
  - sous-titre
  - bouton `Inviter un utilisateur`
  - bouton `Créer un rôle`
- KPI :
  - total utilisateurs
  - utilisateurs actifs
  - invitations en attente
  - administrateurs
- Table :
  - recherche utilisateur
  - filtres rôle, statut, équipe, site
  - bouton filtres
  - colonnes utilisateur, email, rôle, équipe, site, statut, dernière connexion, actions
- Right rail :
  - rôles & permissions
  - répartition par site
- Bottom :
  - invitations récentes
  - journal d’activité

### 8. Composants visibles
- `UserManagementPage`
- `KpiCard`
- `UserFilterBar`
- `UsersTable`
- `RolePermissionCard`
- `RoleCard`
- `RecentInvitationsCard`
- `ActivityJournalCard`
- `SiteDistributionChart`
- `StatusBadge`
- `RoleBadge`
- `Pagination`
- `Button`

### 9. Données affichées
- KPI :
  - total utilisateurs 128
  - utilisateurs actifs 112
  - invitations en attente 6
  - administrateurs 12
- Utilisateurs :
  - Lucas Dupont
  - Camille Martin
  - Thomas Bernard
  - Sophie Leroy
  - Hugo Moreau
  - Élise Fontaine
  - Julien Petit
  - Nina Robert
- Rôles :
  - Administrateur — 12 utilisateurs
  - Manager — 28 utilisateurs
  - Recruteur — 56 utilisateurs
  - Éditeur — 32 utilisateurs
- Sites :
  - Paris
  - Lyon
  - Bordeaux
  - Lille
  - Nantes
  - Autres
- Invitations :
  - Antoine Blanchard
  - Marie Simon
  - Jules Perrot
- Activité :
  - invitation envoyée
  - changement de rôle
  - désactivation de compte

### 10. Actions utilisateur visibles
- Inviter un utilisateur.
- Créer un rôle.
- Rechercher et filtrer.
- Modifier un utilisateur via icône crayon.
- Ouvrir menu actions.
- Paginer.
- Gérer les rôles.
- Créer un rôle personnalisé.
- Voir toutes les invitations.
- Renvoyer ou gérer une invitation.
- Voir tout le journal d’activité.
- Voir détail de la répartition par site.

### 11. États UI visibles
- Sidebar `Utilisateurs` active.
- KPI avec tendance verte.
- Badges de rôle colorés.
- Statuts `Actif`, `En pause`, `Inactif`.
- Tag `Vous` sur l’utilisateur courant.
- Pagination active.
- Donut chart de répartition par site.
- Invitations en attente avec badge orange.

### 12. Composants à créer ou réutiliser
À réutiliser :
- `AppShell`
- `PageHeader`
- `KpiCard`
- `DataTable`
- `StatusBadge`
- `RoleBadge`
- `Pagination`
- `Button`
- `RightInsightPanel`

À créer :
- `UserManagementPage`
- `UserFilterBar`
- `UsersTable`
- `UserIdentityCell`
- `RolesPermissionsPanel`
- `RolePermissionCard`
- `RecentInvitationsCard`
- `UserActivityJournalCard`
- `SiteDistributionChart`

### 13. Contraintes de fidélité visuelle
- La table utilisateurs doit rester au centre.
- Les rôles doivent rester en cards dans le right rail.
- La répartition par site doit rester en donut chart.
- Les invitations et le journal d’activité doivent rester en bas.
- Ne pas fusionner cet écran avec l’écran admin global.
- Utiliser `visx` pour le donut chart.

### 14. Points d’ambiguïté
- L’écran est proche de `01_admin_dashboard_for_user_management.png`, mais plus orienté module `Utilisateurs`.
- Il faut choisir si `/users` est une route directe ou une sous-route admin.
- `Créer un rôle` ouvre probablement une modal non visible.

### 15. Priorité d’implémentation
**P1** — écran principal du module utilisateurs.

---

## `30_user_profile_in_studio_templates_dashboard.png`

### 1. Nom du fichier
`30_user_profile_in_studio_templates_dashboard.png`

### 2. Type d’écran
Fiche utilisateur détaillée avec informations, rôles, sécurité, activité et notes administratives.

### 3. Module applicatif concerné
`features/users`  
Secondairement : `features/admin`, `features/auth`.

### 4. Route probable
`/users/[userId]`  
ou `/admin/users/[userId]`

### 5. Objectif fonctionnel de l’écran
Consulter et administrer un compte utilisateur : informations, accès, rôle, permissions, sécurité, équipes, activité, historique et notes internes.

### 6. Layout général
- Shell global.
- Sidebar `Utilisateurs` active.
- Breadcrumb `Utilisateurs / Fiche utilisateur`.
- Header utilisateur avec avatar, nom, rôle, statut et actions.
- Bandeau d’informations principales.
- Onglets.
- Grille de cards détaillées.
- Right rail avec aperçu rapide et activité récente.

### 7. Zones principales
- Header :
  - avatar Lucas Dupont
  - badge Administrateur
  - description Administrateur / Direction / Paris
  - boutons Modifier, Réinitialiser le mot de passe, Suspendre, menu
- Bandeau info :
  - email
  - téléphone
  - poste
  - statut
  - site
  - équipe
  - créé le
  - dernière connexion
  - authentification 2FA activée
- Onglets :
  - Informations actif
  - Accès & sécurité
  - Activité
  - Historique
- Cards :
  - coordonnées
  - rôles & permissions
  - sécurité
  - équipes & accès
  - activité récente
  - notes administratives
- Right rail :
  - aperçu rapide
  - activité récente timeline

### 8. Composants visibles
- `UserProfilePage`
- `UserProfileHeader`
- `UserInfoSummary`
- `Tabs`
- `UserCoordinatesCard`
- `UserRolesPermissionsCard`
- `UserSecurityCard`
- `TeamsAccessCard`
- `UserRecentActivityCard`
- `AdministrativeNotesCard`
- `QuickOverviewPanel`
- `ActivityTimelinePanel`
- `StatusBadge`
- `RoleBadge`
- `Button`

### 9. Données affichées
- Utilisateur :
  - Lucas Dupont
  - Administrateur
  - Direction
  - Paris
  - Directeur Artistique
- Coordonnées :
  - email
  - téléphone
  - manager Antoine Blanchard
  - équipe Direction
  - site principal Paris
  - fuseau Europe/Paris
  - langue Français
- Rôles :
  - rôle principal Administrateur
  - permissions standards :
    - gestion utilisateurs
    - gestion rôles
    - paramètres
    - toutes les données
    - exportation
    - +2
  - permissions personnalisées
- Sécurité :
  - 2FA activée
  - sessions actives 2
  - appareils de confiance 3
  - dernière mise à jour mot de passe
  - SSO activé SAML
  - fournisseur Google Workspace
- Équipes :
  - Direction propriétaire
  - Design membre
  - Marketing membre
- Espaces :
  - Studio Templates propriétaire
  - Campagnes 2024 éditeur
- Activité :
  - publication template
  - export rapport
  - mise à jour paramètres
  - invitation
  - modification rôle
- Notes administratives :
  - utilisateur clé équipe direction
  - accès complet rapports et gestion utilisateurs
- Right rail :
  - dernière connexion
  - documents créés 128
  - actions ce mois-ci 42
  - invitations envoyées 8
  - timeline activité récente

### 10. Actions utilisateur visibles
- Modifier le profil.
- Réinitialiser le mot de passe.
- Suspendre le compte.
- Ouvrir menu actions.
- Copier email.
- Gérer rôles & permissions.
- Gérer sécurité.
- Modifier coordonnées.
- Gérer équipes & accès.
- Voir toute l’activité.
- Modifier notes administratives.
- Voir tout l’historique.

### 11. États UI visibles
- Sidebar `Utilisateurs` active.
- Onglet `Informations` actif.
- Statut `Actif`.
- 2FA activée en vert.
- Badge `Administrateur`.
- Bouton danger `Suspendre`.
- Notes administratives sur fond jaune pâle.
- Timeline activité récente à droite.
- Cards blanches arrondies.

### 12. Composants à créer ou réutiliser
À réutiliser :
- `AppShell`
- `Tabs`
- `StatusBadge`
- `RoleBadge`
- `Button`
- `RightInsightPanel`

À créer :
- `UserProfilePage`
- `UserProfileHeader`
- `UserInfoSummaryCard`
- `UserCoordinatesCard`
- `UserRolesPermissionsCard`
- `UserSecurityCard`
- `UserTeamsAccessCard`
- `UserRecentActivityCard`
- `AdministrativeNotesCard`
- `UserQuickOverviewPanel`
- `UserActivityTimelinePanel`

### 13. Contraintes de fidélité visuelle
- Le header utilisateur doit rester riche avec actions.
- Conserver le bandeau d’informations principales.
- Conserver les tabs.
- Les informations doivent rester organisées en cards.
- Le right rail doit rester visible.
- Les notes administratives doivent rester distinguées visuellement.
- Ne pas simplifier en une simple page profil.

### 14. Points d’ambiguïté
- Route directe `/users/[userId]` ou admin `/admin/users/[userId]`; recommandation : `/users/[userId]` si module utilisateurs dédié.
- Les onglets non actifs ne sont pas détaillés.
- Certaines actions critiques comme suspendre et reset password doivent ouvrir confirmation/modal.

### 15. Priorité d’implémentation
**P1** — écran essentiel pour gestion utilisateurs et sécurité.

---

# Synthèse globale du lot

## Mapping écran → route → feature

| Image | Route recommandée | Feature principale | Features secondaires | Priorité |
|---|---|---|---|---|
| `01_admin_dashboard_for_user_management.png` | `/admin/users` | `features/admin` | `features/users`, `features/auth` | P1 |
| `29_user_management_admin_dashboard_interface.png` | `/users` | `features/users` | `features/admin`, `features/auth` | P1 |
| `30_user_profile_in_studio_templates_dashboard.png` | `/users/[userId]` | `features/users` | `features/admin`, `features/auth` | P1 |
| `19_modern_saas_dashboard_for_tag_management.png` | `/admin/tags` | `features/tags` | `features/admin` | P1 |
| `26_saas_tag_management_dashboard_interface.png` | `/admin/tags` | `features/tags` | `features/admin` | P1 |
| `10_candidate_profile_with_tag_management_interface.png` | modal in `/candidates/[candidateId]` | `features/tags` | `features/candidates` | P1 |
| `27_tag_selector_for_candidate_profile.png` | modal in `/candidates/[candidateId]` | `features/tags` | `features/candidates` | P1 |
| `28_tag_selector_in_recruitment_app.png` | modal in `/candidates/[candidateId]` | `features/tags` | `features/candidates` | P1 |

---

# Routes recommandées

```txt
/users
/users/[userId]
/admin/users
/admin/tags
/candidates/[candidateId]