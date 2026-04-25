# Lot Candidats — Screen Descriptions

## Écrans analysés

- `03_candidate_form_dashboard_interface_design.png`
- `04_candidate_information_form_dashboard_ui.png`
- `05_candidate_management_dashboard_overview.png`
- `06_candidate_profile_form_dashboard_screenshot.png`
- `07_candidate_profile_form_in_ats_interface.png`
- `08_candidate_profile_in_recruitment_dashboard.png`
- `09_candidate_profile_management_dashboard_ui.png`
- `13_modern_candidate_profile_form_interface.png`

---

## `03_candidate_form_dashboard_interface_design.png`

### 1. Nom du fichier
`03_candidate_form_dashboard_interface_design.png`

### 2. Type d’écran
Formulaire candidat — étape `Disponibilité & mobilité`.

### 3. Module applicatif concerné
`features/candidates`

### 4. Route probable
`/candidates/[candidateId]/edit?tab=availability-mobility`

### 5. Objectif fonctionnel de l’écran
Permettre la saisie détaillée de la disponibilité, des préférences de travail, de la mobilité géographique, des transports/permis, des autorisations et des préférences salariales du candidat.

### 6. Layout général
- Shell global Studio Templates avec topbar sombre et sidebar gauche.
- Page formulaire avec breadcrumb de retour.
- Header `Fiche candidat` + sous-titre.
- Navigation horizontale par étapes.
- Zone centrale en grille de cards de formulaire.
- Colonne droite fixe avec résumé candidat, progression, boutons d’action, checklist et aide.

### 7. Zones principales
- Topbar : actions globales `Nouveau`, `Ouvrir`, `Enregistrer`, `Exporter`, `Aperçu`, zoom, recherche, partage.
- Sidebar : item `Candidats` actif.
- Stepper horizontal :
  - Coordonnées
  - Disponibilité & mobilité actif
  - Expériences
  - Formations & langues
  - Compétences & tags
  - Emplois recherchés
- Formulaire central :
  - `1. Disponibilité`
  - `2. Préférences de travail`
  - `3. Mobilité géographique`
  - `4. Transport & permis`
  - `5. Autorisations`
  - `6. Préférences salariales`
- Right panel :
  - carte candidat Emma Laurent
  - complétude du profil
  - dernière sauvegarde
  - boutons précédent / sauvegarder / suivant
  - checklist de complétion
  - bloc aide

### 8. Composants visibles
- `AppShell`
- `Topbar`
- `Sidebar`
- `CandidateFormPage`
- `CandidateFormStepper`
- `FormSectionCard`
- `SelectField`
- `DatePickerField`
- `CheckboxGroup`
- `RadioSegmentGroup`
- `MultiSelectField`
- `SliderField`
- `SwitchField`
- `MoneyInput`
- `CandidateSideSummary`
- `ProfileCompletionPanel`
- `StepCompletionChecklist`
- `HelpCard`
- `Button`

### 9. Données affichées
- Candidat :
  - Emma Laurent
  - Responsable Talent
  - statut `En recherche active`
  - complétude `45%`
  - dernière sauvegarde il y a 2 min
- Disponibilité :
  - disponibilité immédiate activée
  - préavis `1 mois`
  - date disponible `01/07/2025`
  - disponibilité hebdomadaire `5 jours / semaine`
  - temps plein
  - horaires `Journée (9h - 18h)`
  - contrats souhaités : CDI, CDD cochés ; Alternance et Freelance non cochés
- Préférences :
  - télétravail souhaité : `Partiel`
  - mode : `Hybride`
  - rythme déplacement : `Ponctuel`
  - taux déplacement max `20%`
  - travail soir occasionnel
  - travail week-end non
- Mobilité :
  - pays acceptés France, Suisse
  - régions Auvergne-Rhône-Alpes, Île-de-France
  - villes prioritaires Lyon, Paris, Genève
  - ville exclue Marseille
  - rayon 50 km
  - mobilité nationale activée
  - mobilité internationale et relocalisation désactivées
- Transport :
  - permis B
  - véhicule personnel activé
  - transports en commun activé
  - mobilité douce désactivée
- Autorisations :
  - autorisé à travailler en France
  - visa non requis
  - passeport en cours de validité
- Salaire :
  - rémunération actuelle 48 000 € brut annuel
  - prétentions 55 000 € brut annuel
  - bonus 10%
  - avantages : tickets restaurant, télétravail

### 10. Actions utilisateur visibles
- Revenir à la liste des candidats.
- Naviguer entre les onglets/étapes du formulaire.
- Modifier les champs de disponibilité.
- Sélectionner contrats, pays, régions, villes.
- Ajuster le rayon de mobilité.
- Activer/désactiver les switches de mobilité et transport.
- Enregistrer le brouillon.
- Sauvegarder.
- Passer à l’étape suivante.
- Revenir à l’étape précédente.
- Consulter l’aide/support.

### 11. États UI visibles
- Étape `Disponibilité & mobilité` active en violet.
- Sidebar `Candidats` active.
- Switches activés en violet.
- Checkboxes cochées en violet.
- Radio `Hybride` sélectionné avec bordure violette.
- Progression profil à 45%.
- Checklist avec étape en cours marquée en violet.
- Champs non remplis ou non actifs en gris clair.

### 12. Composants à créer ou réutiliser
À réutiliser :
- `AppShell`
- `Topbar`
- `Sidebar`
- `FormSectionCard`
- `Button`
- `StatusBadge`
- `ProgressBar`
- `HelpCard`

À créer :
- `CandidateAvailabilityMobilityPage`
- `CandidateFormStepper`
- `CandidateRightRail`
- `AvailabilitySection`
- `WorkPreferencesSection`
- `GeographicMobilitySection`
- `TransportPermitSection`
- `WorkAuthorizationSection`
- `SalaryPreferencesSection`
- `ProfileCompletionChecklist`

### 13. Contraintes de fidélité visuelle
- Conserver la navigation horizontale par étapes en haut du formulaire.
- Respecter la mise en page en deux colonnes de cards, avec right rail fixe.
- Les cards doivent rester aérées, avec bordures fines et coins arrondis.
- Les champs doivent conserver une hauteur compacte et un style SaaS premium.
- Les actions principales doivent rester dans la colonne droite.
- Ne pas transformer l’écran en formulaire vertical classique.

### 14. Points d’ambiguïté
- Le nom du fichier est générique, mais l’image correspond précisément à l’étape disponibilité/mobilité.
- Certaines données comme pays/régions/villes nécessitent probablement un composant autocomplete/multiselect.
- La logique de progression profil n’est pas explicitée, mais doit être calculée par étape complétée.

### 15. Priorité d’implémentation
**P1** — étape majeure de la fiche candidat.

---

## `04_candidate_information_form_dashboard_ui.png`

### 1. Nom du fichier
`04_candidate_information_form_dashboard_ui.png`

### 2. Type d’écran
Formulaire candidat — étape `Coordonnées`.

### 3. Module applicatif concerné
`features/candidates`

### 4. Route probable
`/candidates/[candidateId]/edit?tab=contact`

### 5. Objectif fonctionnel de l’écran
Permettre la saisie complète des informations personnelles, coordonnées, adresses, préférences de communication, consentement RGPD, contact d’urgence et notes libres du candidat.

### 6. Layout général
- Shell global identique.
- Page `Fiche candidat`.
- Stepper horizontal avec `Coordonnées` actif.
- Formulaire central organisé en cards numérotées.
- Colonne droite avec résumé candidat, complétude, sauvegarde, actions et aide.

### 7. Zones principales
- Header :
  - retour à la liste des candidats
  - titre `Fiche candidat`
  - sous-titre `Saisie des informations du candidat`
- Stepper :
  - `Coordonnées` actif
  - autres étapes visibles
- Formulaire :
  - `1. Informations personnelles`
  - `2. Coordonnées`
  - `3. Adresse principale`
  - `4. Adresse secondaire`
  - `5. Communication`
  - `6. Notes`
- Right panel :
  - profil Emma Laurent
  - progression 45%
  - dernière sauvegarde
  - boutons `Enregistrer le brouillon`, `Sauvegarder`, `Suivant`
  - checklist de complétion
  - aide/support

### 8. Composants visibles
- `CandidateContactPage`
- `CandidateFormStepper`
- `FormSectionCard`
- `PhotoUpload`
- `TextInput`
- `EmailInput`
- `PhoneInput`
- `DatePickerField`
- `SelectField`
- `AddressFields`
- `CommunicationPreferenceSelector`
- `TimeRangePicker`
- `Checkbox`
- `Textarea`
- `CandidateRightRail`
- `ProfileCompletionChecklist`

### 9. Données affichées
- Informations personnelles :
  - photo
  - civilité Madame
  - prénom Emma
  - nom Laurent
  - nom d’usage Laurent
  - date de naissance 14/05/1992
  - nationalité Française
  - statut candidat `En recherche active`
  - source candidat `LinkedIn`
- Coordonnées :
  - email principal `emma.laurent@email.com`
  - email secondaire `emma.laurent@outlook.com`
  - téléphone mobile `+33 6 12 34 56 78`
  - téléphone secondaire `+33 7 98 76 54 32`
  - LinkedIn
  - portfolio/site web
- Adresse principale :
  - 12 rue de la République
  - Appartement 3B
  - 69002
  - Lyon
  - Auvergne-Rhône-Alpes
  - France
- Adresse secondaire :
  - champs vides
  - option même que l’adresse principale
- Communication :
  - préférence email active
  - téléphone et WhatsApp disponibles
  - créneau jours ouvrés 09:00 à 18:00
  - consentement RGPD coché
  - contact d’urgence Sophie Laurent, sœur, téléphone
- Notes :
  - commentaire recruteur
  - compteur `98 / 2000`

### 10. Actions utilisateur visibles
- Changer la photo.
- Modifier tous les champs personnels et de contact.
- Choisir la préférence de contact.
- Ajouter un créneau de contact.
- Cocher consentement RGPD.
- Saisir des notes.
- Enregistrer le brouillon.
- Sauvegarder.
- Passer à l’étape suivante.
- Naviguer entre les étapes.

### 11. États UI visibles
- Étape `Coordonnées` active.
- Champs requis indiqués par astérisque rouge.
- Checkbox RGPD cochée.
- Préférence `Email` sélectionnée.
- Progression profil 45%.
- Dernière sauvegarde validée.
- Bouton principal `Suivant` en violet.
- Boutons secondaires bordés.

### 12. Composants à créer ou réutiliser
À réutiliser :
- `AppShell`
- `CandidateFormStepper`
- `FormSectionCard`
- `CandidateRightRail`
- `Button`
- `Input`
- `Select`
- `Checkbox`
- `Textarea`

À créer :
- `CandidateContactPage`
- `PersonalInformationSection`
- `CandidatePhotoUpload`
- `ContactInformationSection`
- `PrimaryAddressSection`
- `SecondaryAddressSection`
- `CommunicationPreferencesSection`
- `EmergencyContactFields`
- `CandidateNotesSection`

### 13. Contraintes de fidélité visuelle
- La photo doit rester intégrée dans la card informations personnelles.
- Les champs doivent être alignés en grille compacte.
- Les sections doivent conserver leur numérotation.
- La colonne droite ne doit pas disparaître.
- Les boutons de sauvegarde doivent rester visibles à droite.
- Respecter le style clair, bordures fines, accent violet.

### 14. Points d’ambiguïté
- Le comportement exact de `Même que l’adresse principale` n’est pas visible.
- Le composant téléphone avec drapeau doit être défini ou simulé.
- La gestion RGPD réelle doit être précisée dans le modèle de données.

### 15. Priorité d’implémentation
**P1** — étape de base de la fiche candidat.

---

## `05_candidate_management_dashboard_overview.png`

### 1. Nom du fichier
`05_candidate_management_dashboard_overview.png`

### 2. Type d’écran
Dashboard de gestion des candidats / liste ATS.

### 3. Module applicatif concerné
`features/candidates`

### 4. Route probable
`/candidates`

### 5. Objectif fonctionnel de l’écran
Centraliser les profils candidats, le sourcing, les filtres, le pipeline de recrutement, les tâches, les relances, les campagnes et les alertes.

### 6. Layout général
- Shell global avec sidebar et topbar.
- Header `Candidats` avec actions principales.
- KPI row.
- Table centrale avec filtres.
- Colonne droite analytique.
- Cards opérationnelles en bas.

### 7. Zones principales
- Header :
  - titre `Candidats`
  - sous-titre
  - boutons `Ajouter un candidat`, `Importer des CV`, `Créer une campagne`
- KPI :
  - total candidats
  - nouveaux cette semaine
  - en entretien
  - placés/recrutés
- Barre de filtres :
  - recherche candidat
  - statut
  - secteur
  - métier recherché
  - localisation
  - niveau expérience
  - disponibilité
  - bouton filtres
  - réinitialiser
- Table candidats :
  - checkbox
  - candidat
  - métier recherché
  - secteur
  - expérience
  - localisation
  - disponibilité
  - score
  - statut pipeline
  - dernière activité
  - actions
- Right panel :
  - pipeline recrutement
  - sources des candidats
  - alertes
- Bottom cards :
  - tâches à venir
  - candidats à relancer
  - campagnes actives

### 8. Composants visibles
- `CandidatesDashboardPage`
- `KpiCard`
- `CandidateFilterBar`
- `CandidatesTable`
- `StatusBadge`
- `ScoreRing`
- `Pagination`
- `PipelineChart`
- `DonutChart`
- `TaskListCard`
- `CandidateFollowUpCard`
- `CampaignListCard`
- `AlertsPanel`
- `Button`

### 9. Données affichées
- Total candidats : `1 248`
- Nouveaux cette semaine : `42`
- En entretien : `76`
- Placés/recrutés : `18`
- Candidats listés :
  - Camille Martin
  - Thomas Bernard
  - Sophie Leroy
  - Hugo Moreau
  - Élise Fontaine
  - Julien Petit
  - Nina Robert
  - Antoine Blanchard
- Métiers :
  - UX/UI Designer
  - Développeur Full Stack
  - Product Manager
  - Data Analyst
  - Marketing Manager
  - Développeur Backend
  - HR Business Partner
  - Sales Executive
- Statuts :
  - Nouveau
  - Préqualification
  - Entretien
  - Shortlist
  - Placé
- Scores visibles : 92%, 88%, 85%, 75%, 70%, 66%, 60%, 95%.
- Pipeline :
  - Nouveau 512
  - Préqualification 238
  - Entretien 164
  - Shortlist 98
  - Placé 18
- Sources :
  - site carrière
  - LinkedIn
  - cooptation
  - Indeed
  - autres
- Alertes :
  - 12 entretiens sans retour
  - 8 candidats à relancer
  - 2 candidatures en doublon

### 10. Actions utilisateur visibles
- Ajouter un candidat.
- Importer des CV.
- Créer une campagne.
- Rechercher et filtrer.
- Réinitialiser les filtres.
- Ouvrir actions d’un candidat.
- Paginer.
- Voir le pipeline complet.
- Voir le rapport détaillé sources.
- Voir toutes les tâches.
- Voir les candidats à relancer.
- Voir toutes les campagnes.

### 11. États UI visibles
- Sidebar `Candidats` active.
- KPI avec variations vertes.
- Badges de disponibilité :
  - immédiate
  - sous 15 jours
  - sous 1 mois
- Badges secteur/métier colorés.
- Score rings colorés.
- Pagination avec page 1 active.
- Alertes avec indicateurs rouges/bleus/gris.

### 12. Composants à créer ou réutiliser
À réutiliser :
- `AppShell`
- `PageHeader`
- `KpiCard`
- `DataTable`
- `StatusBadge`
- `Pagination`
- `RightInsightPanel`

À créer :
- `CandidatesDashboardPage`
- `CandidateFilterBar`
- `CandidatesTable`
- `CandidateIdentityCell`
- `CandidateScoreRing`
- `RecruitmentPipelinePanel`
- `CandidateSourcesPanel`
- `CandidateAlertsPanel`
- `UpcomingTasksCard`
- `CandidatesToFollowUpCard`
- `ActiveCampaignsCard`

### 13. Contraintes de fidélité visuelle
- La table doit rester l’élément central.
- Les KPI doivent rester au-dessus des filtres.
- La colonne droite analytique doit être conservée.
- Les cards du bas doivent rester visibles.
- Ne pas remplacer le pipeline par une simple liste.
- Utiliser `TanStack Table` pour la table et `visx` pour les graphiques.

### 14. Points d’ambiguïté
- La route peut être `/candidates` ou `/recruitment/candidates`; recommandation : `/candidates`.
- Le comportement exact des campagnes n’est pas visible.
- Les données sont clairement mockées.

### 15. Priorité d’implémentation
**P1** — écran principal du module candidats.

---

## `06_candidate_profile_form_dashboard_screenshot.png`

### 1. Nom du fichier
`06_candidate_profile_form_dashboard_screenshot.png`

### 2. Type d’écran
Formulaire candidat — étape `Emplois recherchés`.

### 3. Module applicatif concerné
`features/candidates`

### 4. Route probable
`/candidates/[candidateId]/edit?tab=target-jobs`

### 5. Objectif fonctionnel de l’écran
Définir les postes recherchés, domaines/secteurs, préférences contractuelles, localisations ciblées, rémunération visée, critères prioritaires et résumé du projet professionnel du candidat.

### 6. Layout général
- Shell global.
- Page `Fiche candidat`.
- Stepper horizontal avec `Emplois recherchés` actif.
- Formulaire central en cards.
- Mini-card de matching avec offres dans la zone centrale haute droite.
- Right rail avec profil, complétude, actions et checklist.

### 7. Zones principales
- Formulaire :
  - `1. Postes recherchés`
  - `2. Domaine & secteur`
  - `3. Préférences contractuelles`
  - `4. Localisations recherchées`
  - `5. Rémunération visée`
  - `6. Critères prioritaires`
  - `7. Résumé du projet professionnel`
- Card matching :
  - `Matching avec offres`
  - liste d’offres avec scores
- Right rail :
  - profil Emma Laurent
  - complétude 95%
  - dernière sauvegarde
  - enregistrer fiche
  - enregistrer brouillon
  - terminer
  - checklist complétée

### 8. Composants visibles
- `CandidateTargetJobsPage`
- `CandidateFormStepper`
- `FormSectionCard`
- `TextInput`
- `SelectField`
- `MultiSelectField`
- `CheckboxGroup`
- `MoneyInput`
- `PriorityCriteriaList`
- `Textarea`
- `OfferMatchingCard`
- `CandidateRightRail`
- `ProfileCompletionChecklist`

### 9. Données affichées
- Poste principal recherché : `Cheffe de projet digital`
- Postes alternatifs : Product Owner, Consultante digitale
- Séniorité : Confirmé (3–7 ans)
- Fonction : Gestion de projet
- Famille métiers : Digital / IT
- Domaine : Services
- Sous-domaine : Conseil & Services numériques
- Secteurs ciblés : SaaS, Tech/Logiciels, Transformation digitale
- Secteurs exclus : Public / Administration
- Type d’entreprise : entreprise privée
- Taille : 50 à 500 salariés
- Contrats cochés :
  - CDI
  - CDD
  - Freelance
  - Mission / Portage
  - Temps plein
- Localisations :
  - pays France
  - région Auvergne-Rhône-Alpes
  - villes Lyon, Annecy, Grenoble
  - télétravail hybride
  - mobilité ponctuelle
  - rayon 50 km
  - relocation non
- Rémunération :
  - fixe 52 000 €
  - variable 6 000 €
  - package total 58 000 €
  - devise EUR
- Critères :
  - culture d’entreprise
  - équilibre de vie
  - impact
  - management
  - innovation
  - international
- Résumé projet professionnel.
- Matching :
  - Cheffe de projet digital 92%
  - Product Owner 87%
  - Chef de projet IT 78%

### 10. Actions utilisateur visibles
- Modifier postes, secteurs, localisations.
- Ajouter un critère prioritaire.
- Modifier le résumé professionnel.
- Voir plus d’offres.
- Enregistrer la fiche.
- Enregistrer brouillon.
- Terminer.
- Naviguer entre étapes.

### 11. États UI visibles
- Étape `Emplois recherchés` active.
- Profil complété à 95%.
- Toutes les étapes précédentes cochées en vert.
- Champs requis avec astérisque rouge.
- Bouton `Terminer` principal violet.
- Matching marqué `Très bon`.

### 12. Composants à créer ou réutiliser
À réutiliser :
- `CandidateFormStepper`
- `FormSectionCard`
- `CandidateRightRail`
- `Button`
- `StatusBadge`

À créer :
- `CandidateTargetJobsPage`
- `TargetPositionsSection`
- `DomainSectorSection`
- `ContractPreferencesSection`
- `TargetLocationsSection`
- `TargetCompensationSection`
- `PriorityCriteriaSection`
- `ProfessionalProjectSummarySection`
- `OfferMatchingCard`

### 13. Contraintes de fidélité visuelle
- Conserver la card `Matching avec offres` dans le contenu central, pas dans le right rail.
- Conserver la logique de finalisation avec bouton `Terminer`.
- Les critères prioritaires doivent rester sous forme de chips numérotées.
- Le résumé professionnel doit être en pleine largeur en bas.
- Ne pas réduire les préférences contractuelles à un simple select.

### 14. Points d’ambiguïté
- Le matching offres semble calculé, mais son moteur n’est pas visible.
- Le bouton `Terminer` implique probablement validation complète du profil.
- L’écran montre une complétude 95%, sans expliquer la règle de calcul.

### 15. Priorité d’implémentation
**P1** — étape finale essentielle de la fiche candidat.

---

## `07_candidate_profile_form_in_ats_interface.png`

### 1. Nom du fichier
`07_candidate_profile_form_in_ats_interface.png`

### 2. Type d’écran
Formulaire candidat — étape `Compétences & tags`.

### 3. Module applicatif concerné
`features/candidates`  
Secondairement : `features/tags`.

### 4. Route probable
`/candidates/[candidateId]/edit?tab=skills-tags`

### 5. Objectif fonctionnel de l’écran
Saisir les compétences techniques, comportementales, logiciels/outils, centres d’intérêt, tags, mots-clés, forces et points d’attention du candidat.

### 6. Layout général
- Shell global.
- Stepper candidat avec `Compétences & tags` actif.
- Formulaire en grille asymétrique :
  - grande card compétences techniques,
  - grande card compétences comportementales,
  - colonne logiciels/outils,
  - tags et centres d’intérêt,
  - mots-clés / expertises,
  - forces & points d’attention.
- Right rail avec profil, progression, actions et checklist.

### 7. Zones principales
- `1. Compétences techniques`
- `2. Compétences comportementales`
- `3. Logiciels & outils`
- `4. Centres d’intérêt`
- `5. Tags`
- `6. Mots-clés / expertises`
- `7. Forces & points d’attention`
- Right rail candidat.

### 8. Composants visibles
- `CandidateSkillsTagsPage`
- `SkillRatingRow`
- `RatingScale`
- `ToolRatingList`
- `InterestTagsInput`
- `TagSelector`
- `SuggestedTags`
- `KeywordTextarea`
- `StrengthWeaknessTextarea`
- `CandidateRightRail`
- `ProfileCompletionChecklist`

### 9. Données affichées
- Compétences techniques :
  - Recrutement IT niveau 5, 6 ans, dernière utilisation avril 2024
  - Sourcing LinkedIn niveau 5, 5 ans, mai 2024
  - Entretien structuré niveau 4, 4 ans, avril 2024
  - Droit du travail niveau 3, 3 ans, février 2024
- Compétences comportementales :
  - Communication niveau 5
  - Leadership niveau 4
  - Gestion de projet niveau 4
  - Adaptabilité niveau 5
  - Esprit d’analyse niveau 4
- Logiciels/outils :
  - ATS Workable niveau 5
  - CRM HubSpot niveau 4
  - Microsoft Excel niveau 4
  - Power BI niveau 3
  - LinkedIn Recruiter niveau 5
  - Google Workspace niveau 4
- Centres d’intérêt :
  - Running
  - Voyages
  - Lecture
  - Photographie
  - Éducation & pédagogie
- Tags sélectionnés :
  - Sourcing
  - Recrutement IT
  - Tech
  - RH
- Tags suggérés :
  - Agile
  - SaaS
  - Management
  - Transformation digitale
  - Onboarding
- Mots-clés :
  - Recrutement IT, Sourcing, LinkedIn Recruiter, Entretien structuré, Marque employeur, ATS, Onboarding, RPO, Talent Acquisition
- Forces :
  - écoute, rigueur, orientation résultats, adaptabilité, autonomie
- Points d’attention :
  - perfectionnisme, délégation

### 10. Actions utilisateur visibles
- Ajouter une compétence.
- Supprimer une compétence via icône corbeille.
- Modifier notes 1 à 5.
- Ajouter un outil.
- Ajouter un centre d’intérêt.
- Supprimer des chips.
- Rechercher un tag.
- Ajouter un tag.
- Sélectionner des tags suggérés.
- Rédiger mots-clés, forces et points d’attention.
- Enregistrer le brouillon.
- Sauvegarder.
- Passer à l’étape suivante.

### 11. États UI visibles
- Étape `Compétences & tags` active.
- Notes sélectionnées en violet.
- Chips sélectionnées avec croix.
- Progression profil 65%.
- Étapes précédentes cochées.
- Étape courante marquée en violet.
- Champs textarea avec compteurs.

### 12. Composants à créer ou réutiliser
À réutiliser :
- `CandidateFormStepper`
- `FormSectionCard`
- `CandidateRightRail`
- `Button`
- `TagChip`
- `Textarea`

À créer :
- `CandidateSkillsTagsPage`
- `TechnicalSkillsSection`
- `BehavioralSkillsSection`
- `SoftwareToolsSection`
- `InterestsSection`
- `CandidateTagsSection`
- `KeywordExpertiseSection`
- `StrengthsWatchpointsSection`
- `SkillRatingRow`
- `RatingScale`

### 13. Contraintes de fidélité visuelle
- Les niveaux doivent rester représentés par boutons 1–5, pas un select.
- Les tags doivent être visibles sous forme de chips.
- La recherche de tag et le bouton `Ajouter un tag` doivent rester côte à côte.
- Les sections `Forces` et `Points d’attention` doivent rester séparées.
- Ne pas confondre tags libres et compétences notées.

### 14. Points d’ambiguïté
- Le gestionnaire de tags global est ailleurs ; ici il s’agit du picker candidat.
- Certaines compétences semblent modifiables inline, mais pas via modal visible.
- Les tags suggérés pourraient venir d’IA ou de règles métier, non visible.

### 15. Priorité d’implémentation
**P1** — étape centrale pour matching, tags et CV dynamique.

---

## `08_candidate_profile_in_recruitment_dashboard.png`

### 1. Nom du fichier
`08_candidate_profile_in_recruitment_dashboard.png`

### 2. Type d’écran
Fiche candidat détaillée — vue résumé / profil recrutement.

### 3. Module applicatif concerné
`features/candidates`

### 4. Route probable
`/candidates/[candidateId]`

### 5. Objectif fonctionnel de l’écran
Afficher une vue consolidée du candidat : identité, coordonnées, expérience, compétences, documents, évaluations, historique, matching et statut pipeline.

### 6. Layout général
- Shell global.
- Header candidat avec photo, nom, statut, score et actions.
- Bandeau de coordonnées clés.
- Onglets de fiche.
- Grille de cards résumé au centre.
- Right rail analytique avec matching, pipeline, prochaine action, assignation, tags et radar.

### 7. Zones principales
- Header :
  - photo
  - nom `Emma Laurent`
  - favori étoile
  - poste/titre
  - badges statut/score
  - boutons contacter, planifier entretien, partager, exporter PDF
- Info strip :
  - localisation
  - téléphone
  - email
  - LinkedIn
  - disponibilité
  - prétentions
  - mobilité
  - permis
  - télétravail
- Onglets :
  - résumé actif
  - évaluations
  - correspondances
  - activité
  - documents
  - notes internes
- Contenu :
  - résumé profil
  - formations/certifications
  - langues
  - documents
  - expériences professionnelles
  - compétences clés
  - centres d’intérêt
  - secteurs recherchés
  - métiers recherchés
  - évaluations & notes
  - historique interactions
  - disponibilité & préférences
- Right rail :
  - matching global
  - statut candidat
  - prochaine action
  - assigné à
  - tags
  - analyse d’adéquation radar

### 8. Composants visibles
- `CandidateProfilePage`
- `CandidateHeader`
- `CandidateInfoStrip`
- `Tabs`
- `ProfileSummaryCard`
- `ExperienceTimelineCard`
- `SkillsProgressCard`
- `EducationCard`
- `LanguagesCard`
- `DocumentsTableCard`
- `EvaluationsCard`
- `InteractionHistoryCard`
- `MatchingScorePanel`
- `PipelineStatusPanel`
- `NextActionCard`
- `AssignedRecruiterCard`
- `CandidateTagsPanel`
- `RadarChart`

### 9. Données affichées
- Emma Laurent
- Responsable Recrutement & Talent Acquisition
- badges :
  - disponible
  - candidate active
  - score global 86%
- Localisation Lyon, France
- Téléphone, email, LinkedIn
- Disponibilité sous 15 jours
- Prétentions 55–65 K€ brut/an
- Mobilité France entière
- Permis B
- Télétravail hybride
- Expériences :
  - Responsable Recrutement & Talent Acquisition chez Doctolib
  - Talent Acquisition Manager chez Cegid
  - Consultante Recrutement chez Michael Page
- Compétences :
  - Sourcing & Chasse
  - Entretien & Évaluation
  - Marque employeur
  - Leadership & Management
  - ATS
- Documents :
  - CV
  - lettre motivation
  - portfolio
  - diplôme
- Évaluations :
  - score 84/100
  - notes recruteurs
- Pipeline :
  - nouveau, préqualifié, entretien final, offre, embauché
- Tags :
  - Top talent
  - Recommandé
  - Leadership
  - Sourcing expert
  - Culture fit
  - Anglais C1

### 10. Actions utilisateur visibles
- Contacter.
- Planifier un entretien.
- Partager.
- Exporter PDF.
- Ouvrir menu actions.
- Changer d’onglet.
- Voir résumé complet.
- Voir toutes les expériences.
- Voir toutes les compétences.
- Ajouter document.
- Ajouter évaluation.
- Ajouter un tag.
- Voir agenda.
- Envoyer un message au recruteur assigné.

### 11. États UI visibles
- Onglet `Résumé` actif.
- Matching global 86%.
- Statut pipeline `Entretien final` actif.
- Barres de progression compétences.
- Radar chart.
- Badges colorés.
- Cards denses mais lisibles.

### 12. Composants à créer ou réutiliser
À réutiliser :
- `AppShell`
- `Tabs`
- `StatusBadge`
- `ProgressBar`
- `DataTable`
- `Button`
- `TagChip`

À créer :
- `CandidateProfilePage`
- `CandidateProfileHeader`
- `CandidateInfoStrip`
- `CandidateSummaryGrid`
- `ExperienceTimeline`
- `CandidateSkillsCard`
- `CandidateDocumentsCard`
- `CandidateEvaluationsCard`
- `CandidateInteractionHistory`
- `CandidateMatchingPanel`
- `CandidatePipelinePanel`
- `CandidateRadarChart`

### 13. Contraintes de fidélité visuelle
- La fiche doit rester très riche, pas simplifiée.
- Le right rail analytique est essentiel.
- Le header candidat doit rester large avec actions.
- Les onglets doivent rester sous l’info strip.
- Les cards doivent être conservées en grille.
- Le radar chart doit utiliser `visx`.

### 14. Points d’ambiguïté
- Certaines données sont difficiles à lire précisément mais la structure est claire.
- La vue peut partager des composants avec les formulaires candidat, mais ne doit pas être une page edit.
- Les onglets secondaires ne sont pas visibles en détail.

### 15. Priorité d’implémentation
**P1** — écran central de consultation candidat.

---

## `09_candidate_profile_management_dashboard_ui.png`

### 1. Nom du fichier
`09_candidate_profile_management_dashboard_ui.png`

### 2. Type d’écran
Formulaire candidat — étape `Expériences`.

### 3. Module applicatif concerné
`features/candidates`

### 4. Route probable
`/candidates/[candidateId]/edit?tab=experiences`

### 5. Objectif fonctionnel de l’écran
Permettre la saisie, l’import et la gestion des expériences professionnelles du candidat, avec analyse automatique du parcours.

### 6. Layout général
- Shell global.
- Formulaire candidat avec stepper.
- Zone centrale large pour formulaire d’expérience.
- Card d’analyse du parcours à droite du formulaire central.
- Right rail candidat séparé à droite.
- Liste/timeline des expériences enregistrées en bas.

### 7. Zones principales
- Header `Fiche candidat`.
- Stepper avec `Expériences` actif.
- Section `3. Expériences professionnelles`.
- Boutons :
  - importer depuis le CV
  - ajouter une expérience
- Formulaire expérience :
  - poste
  - entreprise
  - type contrat
  - secteur
  - domaine
  - ville/pays
  - dates
  - poste actuel
  - niveau hiérarchique
  - équipe managée
  - taille équipe
  - salaire/devise
  - technologies/outils
  - résumé poste
  - missions
  - résultats/réalisations
  - mots-clés
- Analyse du parcours :
  - expérience totale
  - stabilité moyenne
  - secteurs couverts
  - management
  - mobilité géographique
- Expériences enregistrées :
  - timeline 2021-aujourd’hui
  - 2018-2021
  - 2015-2018
  - édition/suppression
  - ajouter une expérience
- Right rail :
  - profil
  - complétude
  - sauvegarde
  - actions
  - checklist

### 8. Composants visibles
- `CandidateExperiencesPage`
- `CandidateFormStepper`
- `ExperienceForm`
- `ExperienceTimelineList`
- `ExperienceAnalysisPanel`
- `Textarea`
- `SelectField`
- `DatePickerField`
- `Checkbox`
- `MoneyInput`
- `CandidateRightRail`
- `Button`

### 9. Données affichées
- Candidat Emma Laurent, complétude 45%.
- Analyse :
  - expérience totale 9 ans et 2 mois
  - stabilité moyenne 3,1 ans/poste
  - 3 secteurs
  - 1 expérience management
  - mobilité 2 villes, 1 pays
- Expériences enregistrées :
  - 2021-aujourd’hui — Cheffe de projet digital — Acme Corp — Lyon — CDI
  - 2018-2021 — Consultante fonctionnelle — InnovLab — Paris — CDI
  - 2015-2018 — Assistante chef de projet — Websolution — Lyon — CDI

### 10. Actions utilisateur visibles
- Importer depuis le CV.
- Ajouter une expérience.
- Remplir le formulaire d’expérience.
- Cocher poste actuel.
- Annuler.
- Enregistrer l’expérience.
- Modifier une expérience existante.
- Supprimer une expérience.
- Ajouter une expérience depuis la timeline.
- Enregistrer brouillon.
- Sauvegarder.
- Passer à l’étape suivante.

### 11. États UI visibles
- Étape `Expériences` active.
- Champs obligatoires avec astérisque.
- Liste des expériences en timeline verticale.
- Expérience actuelle avec badge `Actuel`.
- Actions edit/delete visibles.
- Analyse du parcours en cards compactes.
- Progression 45%.

### 12. Composants à créer ou réutiliser
À réutiliser :
- `CandidateFormStepper`
- `FormSectionCard`
- `CandidateRightRail`
- `Button`
- `SelectField`
- `Textarea`

À créer :
- `CandidateExperiencesPage`
- `ExperienceForm`
- `ExperienceAnalysisPanel`
- `ExperienceTimelineList`
- `ExperienceTimelineItem`
- `ImportFromCvButton`

### 13. Contraintes de fidélité visuelle
- Garder l’analyse du parcours dans une card séparée.
- Conserver la timeline des expériences enregistrées.
- Le formulaire ne doit pas devenir une modal unique.
- Les zones `missions` et `résultats` doivent être des textareas séparées.
- Le bouton `Importer depuis le CV` doit rester visible en haut.

### 14. Points d’ambiguïté
- L’import CV implique un service d’extraction non visible.
- Les résultats de l’analyse peuvent être calculés à partir des expériences ou mockés en V1.
- Le numéro de section commence à `3`, car il correspond à l’étape expériences.

### 15. Priorité d’implémentation
**P1** — étape critique pour profils, CV dynamiques et matching.

---

## `13_modern_candidate_profile_form_interface.png`

### 1. Nom du fichier
`13_modern_candidate_profile_form_interface.png`

### 2. Type d’écran
Formulaire candidat — étape `Formations & langues`.

### 3. Module applicatif concerné
`features/candidates`

### 4. Route probable
`/candidates/[candidateId]/edit?tab=education-languages`

### 5. Objectif fonctionnel de l’écran
Permettre la saisie des formations, certifications, langues, séjours internationaux et références de niveau CECRL.

### 6. Layout général
- Shell global.
- Page formulaire candidat.
- Stepper avec `Formations & langues` actif.
- Grande zone centrale organisée en sections pleine largeur et sous-grilles.
- Right rail candidat avec profil, progression, actions, checklist et aide.

### 7. Zones principales
- `1. Formations`
- `2. Certifications`
- `3. Langues`
- `4. Séjours internationaux / Échanges académiques`
- `5. Équivalences de niveau (CECRL)`
- Right rail :
  - profil
  - complétude 60%
  - actions
  - checklist
  - aide

### 8. Composants visibles
- `CandidateEducationLanguagesPage`
- `CandidateFormStepper`
- `EducationEntryForm`
- `CertificationEntryForm`
- `LanguagesTable`
- `InternationalStayList`
- `CecrlReferenceTable`
- `FileAttachmentField`
- `DatePickerField`
- `SelectField`
- `TextInput`
- `Toggle`
- `Button`
- `CandidateRightRail`

### 9. Données affichées
- Formations :
  - Master 2 Data Science
  - Bac +5
  - Université Lyon 1
  - Informatique
  - spécialisation intelligence artificielle
  - Lyon, France
  - dates 09/2019 à 09/2021
  - mention bien
  - mémoire : prédiction séries temporelles avec LSTM
  - pièce jointe `memoire_lstm.pdf`
  - Licence Informatique
  - Bac +3
  - Université Lyon 1
  - spécialisation développement logiciel
  - Villeurbanne, France
  - dates 09/2016 à 06/2019
  - mention assez bien
  - projet : application web de gestion de tâches
  - pièce jointe `rapport_projet.pdf`
- Certifications :
  - AWS Certified Solutions Architect — Associate
  - Google Data Analytics Professional Certificate
  - organismes, années, expirations, identifiants, liens de vérification
- Langues :
  - Français C2
  - Anglais C1
  - Espagnol B2
  - langue maternelle toggle
  - expression orale/écrite, compréhension, score, certification, commentaire
- Séjours :
  - Canada, 09/2021–12/2021, échange université Montréal
  - Espagne, 06/2018–08/2018, Erasmus+ Séville
- CECRL :
  - niveaux A1 à C2
  - repères utilisateur élémentaire à expérimenté

### 10. Actions utilisateur visibles
- Ajouter une formation.
- Supprimer une formation.
- Ajouter une certification.
- Supprimer une certification.
- Ajouter une langue.
- Modifier les niveaux langue.
- Ajouter un séjour.
- Supprimer un séjour.
- Joindre des fichiers.
- Enregistrer brouillon.
- Sauvegarder.
- Passer à l’étape suivante.

### 11. États UI visibles
- Étape `Formations & langues` active.
- Complétude 60%.
- Plusieurs étapes précédentes cochées.
- Pièces jointes affichées comme chips/fichiers.
- Toggles langue maternelle.
- Champs requis avec astérisque.
- Table CECRL colorée en bas.

### 12. Composants à créer ou réutiliser
À réutiliser :
- `CandidateFormStepper`
- `FormSectionCard`
- `CandidateRightRail`
- `Button`
- `SelectField`
- `DatePickerField`
- `FileAttachmentField`

À créer :
- `CandidateEducationLanguagesPage`
- `EducationSection`
- `EducationEntryForm`
- `CertificationSection`
- `LanguageSkillsSection`
- `LanguagesTable`
- `InternationalStaySection`
- `CecrlReferenceTable`

### 13. Contraintes de fidélité visuelle
- Les formations doivent rester en blocs répétés très complets.
- Les langues doivent être en table, pas en simple liste.
- Les pièces jointes doivent être visibles.
- La table CECRL doit rester en bas comme référence.
- Ne pas supprimer les séjours internationaux.
- Conserver le right rail.

### 14. Points d’ambiguïté
- Les formations semblent éditables inline ; pas de modal visible.
- Les pièces jointes impliquent le stockage S3-compatible et Uppy, mais l’upload lui-même n’est pas montré.
- Les niveaux langue mélangent CECRL et scores TOEIC/TOEFL/IELTS.

### 15. Priorité d’implémentation
**P1** — étape importante pour CV dynamique et profil candidat.

---

# Synthèse globale du lot

## Mapping écran → route → feature

| Image | Route recommandée | Feature principale | Features secondaires | Priorité |
|---|---|---|---|---|
| `05_candidate_management_dashboard_overview.png` | `/candidates` | `features/candidates` | `features/tags`, `features/notifications` | P1 |
| `08_candidate_profile_in_recruitment_dashboard.png` | `/candidates/[candidateId]` | `features/candidates` | `features/tags`, `features/exports`, `features/ai` | P1 |
| `04_candidate_information_form_dashboard_ui.png` | `/candidates/[candidateId]/edit?tab=contact` | `features/candidates` | `features/notifications` | P1 |
| `03_candidate_form_dashboard_interface_design.png` | `/candidates/[candidateId]/edit?tab=availability-mobility` | `features/candidates` | — | P1 |
| `09_candidate_profile_management_dashboard_ui.png` | `/candidates/[candidateId]/edit?tab=experiences` | `features/candidates` | `features/ai` | P1 |
| `13_modern_candidate_profile_form_interface.png` | `/candidates/[candidateId]/edit?tab=education-languages` | `features/candidates` | `features/exports` | P1 |
| `07_candidate_profile_form_in_ats_interface.png` | `/candidates/[candidateId]/edit?tab=skills-tags` | `features/candidates` | `features/tags`, `features/ai` | P1 |
| `06_candidate_profile_form_dashboard_screenshot.png` | `/candidates/[candidateId]/edit?tab=target-jobs` | `features/candidates` | `features/ai` | P1 |

---

# Routes recommandées

```txt
/candidates
/candidates/[candidateId]
/candidates/[candidateId]/edit
/candidates/[candidateId]/edit?tab=contact
/candidates/[candidateId]/edit?tab=availability-mobility
/candidates/[candidateId]/edit?tab=experiences
/candidates/[candidateId]/edit?tab=education-languages
/candidates/[candidateId]/edit?tab=skills-tags
/candidates/[candidateId]/edit?tab=target-jobs