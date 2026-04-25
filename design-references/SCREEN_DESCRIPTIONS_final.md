 

---

# SCREEN_DESCRIPTIONS 1.md

# Lot Admin / Settings / Paiements — Screen Descriptions

## Écrans analysés

- `02_admin_dashboard_with_system_health_overview.png`
- `11_dark_themed_database_admin_dashboard_ui.png`
- `12_email_server_and_notifications_dashboard.png`
- `14_modern_dark_themed_admin_dashboard_ui.png`
- `17_modern_payments_and_billing_dashboard_ui.png`
- `23_payment_tracking_dashboard_overview.png`
- `24_saas_admin_dashboard_with_settings_panel.png`

---

## `02_admin_dashboard_with_system_health_overview.png`

### 1. Nom du fichier
`02_admin_dashboard_with_system_health_overview.png`

### 2. Type d’écran
Dashboard d’administration global avec aperçu système.

### 3. Module applicatif concerné
`features/admin`  
Secondairement : `features/users`, `features/payments`, `features/ai`, `features/notifications`, `features/exports`.

### 4. Route probable
`/admin`

### 5. Objectif fonctionnel de l’écran
Fournir une vue d’ensemble de la configuration globale, des services techniques et de l’état opérationnel de la plateforme.

### 6. Layout général
- Shell applicatif complet avec topbar sombre, sidebar gauche sombre, contenu principal clair et colonne droite de supervision.
- Contenu central organisé en header, rangée de KPI cards et grille de modules d’administration.
- Colonne droite dédiée à la santé système, aux actions rapides et aux dernières alertes.

### 7. Zones principales
- Topbar : nouveau, ouvrir, enregistrer, exporter, aperçu, zoom, recherche, partager/publier.
- Sidebar : navigation principale avec `Administration` actif.
- KPI cards : utilisateurs actifs, services connectés, paiements du mois, LLM en ligne, tickets critiques, dernière sauvegarde.
- Modules d’administration : paramètres généraux, utilisateurs & rôles, base de données, serveur mail, LLM & IA, API & webhooks, paiements, règlements, sécurité & conformité, logs & audits.
- Right panel : santé système, actions rapides, dernières alertes.

### 8. Composants visibles
- `AppShell`
- `Topbar`
- `Sidebar`
- `PageHeader`
- `KpiCard`
- `AdminModuleCard`
- `StatusBadge`
- `SystemHealthList`
- `QuickActionList`
- `AlertList`
- `IconBadge`
- `UserWorkspaceCard`

### 9. Données affichées
- Utilisateurs actifs : `128`
- Services connectés : `14 / 18`
- Paiements du mois : `24 580 €`
- LLM en ligne : `2 / 2`
- Tickets critiques : `2`
- Dernière sauvegarde : `Il y a 9 min`
- Santé système :
  - Base de données : PostgreSQL 14 — opérationnel
  - Serveur mail : SMTP SendGrid — opérationnel
  - API : REST API — opérationnel
  - LLM & IA : OpenAI / Anthropic — opérationnel
  - Paiements : Stripe — opérationnel
- Alertes :
  - échec de paiement récurrent
  - quota LLM bientôt atteint
  - sauvegarde dépassée

### 10. Actions utilisateur visibles
- Accéder aux modules d’administration via les cards.
- Vider le cache.
- Tester les services.
- Lancer une sauvegarde manuelle.
- Exporter les logs.
- Activer/désactiver le mode maintenance.
- Voir le détail de la santé système.
- Voir toutes les alertes.

### 11. États UI visibles
- `Administration` actif dans la sidebar.
- Badges : `Configuré`, `Actif`, `À vérifier`, `À traiter`, `Opérationnel`.
- Indicateurs verts, rouges et orange.
- Toggle désactivé pour mode maintenance.
- Cards avec icônes pastel sur fond clair.

### 12. Composants à créer ou réutiliser
À réutiliser :
- `AppShell`
- `Topbar`
- `Sidebar`
- `SectionCard`
- `StatusBadge`
- `KpiCard`

À créer :
- `AdminOverviewPage`
- `AdminModuleGrid`
- `AdminModuleCard`
- `SystemHealthPanel`
- `AdminQuickActionsPanel`
- `AdminAlertsPanel`

### 13. Contraintes de fidélité visuelle
- Respecter le contraste topbar/sidebar sombre vs contenu clair.
- Maintenir la grille de KPI en haut.
- Conserver le right panel vertical.
- Reproduire la densité aérée et les cards arrondies.
- Conserver les icônes violettes et les badges colorés.
- Les modules doivent rester des cards larges, pas une simple liste.

### 14. Points d’ambiguïté
- La route exacte peut être `/admin` ou `/administration`; recommandation : `/admin`.
- La card `Règlements` peut correspondre à des règles/CGU ou à des règlements financiers ; l’écran semble plutôt viser les documents/politiques.
- Les actions rapides sont visibles mais leur comportement détaillé n’est pas représenté.

### 15. Priorité d’implémentation
**P1** — écran structurant du module admin.

---

## `11_dark_themed_database_admin_dashboard_ui.png`

### 1. Nom du fichier
`11_dark_themed_database_admin_dashboard_ui.png`

### 2. Type d’écran
Dashboard d’administration de la base de données.

### 3. Module applicatif concerné
`features/admin`

### 4. Route probable
`/settings/database`

### 5. Objectif fonctionnel de l’écran
Superviser la configuration, la performance, les sauvegardes, la réplication, les migrations et la maintenance de la base de données.

### 6. Layout général
- Même shell global que les autres écrans.
- KPI base de données en haut.
- Sections détaillées en grille deux colonnes.
- Colonne droite avec santé de la base, jobs récents et actions.

### 7. Zones principales
- Header : `Base de données`.
- KPI cards : cluster principal, espace utilisé, requêtes/min, dernière sauvegarde, réplication, incidents.
- Sections centrales : connexion & environnement, sauvegardes, performance, réplication & haute disponibilité, migrations, maintenance.
- Right panel : santé de la base, jobs récents, actions.

### 8. Composants visibles
- `DatabaseAdminPage`
- `KpiCard`
- `ProgressBar`
- `InfoListCard`
- `HealthStatusPanel`
- `RecentJobsPanel`
- `ActionListCard`
- `StatusBadge`
- `Toggle`
- `IconBadge`

### 9. Données affichées
- Cluster : `prod-db-01`
- Espace utilisé : `128,4 Go / 500 Go` — `25,7%`
- Requêtes/min : `1 248`
- Dernière sauvegarde : `Il y a 32 min`
- Réplication : `Synchrone`
- Incidents : `0`
- PostgreSQL `14.10`
- Hôte : `prod-db-01.studio.local`
- Port : `5432`
- SSL activé
- Pool de connexions : `100 (utilisé : 32)`
- Sauvegardes :
  - fréquence toutes les 6 heures
  - rétention 7 jours / 30 jours WAL
  - chiffrement AES-256
  - restauration point-in-time activée
- Performance :
  - latence moyenne `12,4 ms`
  - CPU `18%`
  - IOPS `1 250`
  - index `312 (98% utilisés)`
  - requêtes lentes `3`
- Jobs récents :
  - sauvegarde complète
  - sauvegarde WAL
  - analyse automatique
  - VACUUM automatique
  - vérification des réplicas

### 10. Actions utilisateur visibles
- Voir le détail de la santé.
- Voir tous les jobs récents.
- Lancer une sauvegarde.
- Tester la restauration.
- Exporter les logs.
- Redémarrer le cluster.
- Activer le mode maintenance.
- Voir l’historique des migrations.

### 11. États UI visibles
- Statuts verts : `Sain`, `Normal`, `Bon`, `Réussie`, `Appliquée`.
- Barre de progression espace disque.
- Toggle mode maintenance désactivé.
- Grille de cards structurée.
- Right panel avec listes compactes.

### 12. Composants à créer ou réutiliser
À réutiliser :
- `AppShell`
- `Topbar`
- `Sidebar`
- `KpiCard`
- `ProgressBar`
- `StatusBadge`
- `SectionCard`

À créer :
- `DatabaseSettingsPage`
- `DatabaseConnectionCard`
- `DatabaseBackupCard`
- `DatabasePerformanceCard`
- `DatabaseReplicationCard`
- `DatabaseMigrationsCard`
- `DatabaseMaintenanceCard`
- `DatabaseHealthPanel`
- `DatabaseJobsPanel`
- `DatabaseActionsPanel`

### 13. Contraintes de fidélité visuelle
- Garder le format admin clair avec sidebar/topbar sombres.
- Respecter la distribution deux colonnes + right panel.
- Les listes d’informations doivent rester aérées, avec icônes à gauche.
- Les KPI cards doivent rester alignées en haut.
- Ne pas transformer les sections en formulaire dense.

### 14. Points d’ambiguïté
- La route pourrait être `/admin/database`, mais recommandation : `/settings/database`.
- Les actions critiques comme `Redémarrer le cluster` doivent probablement ouvrir une confirmation.
- Les données sont représentatives/mockées.

### 15. Priorité d’implémentation
**P2** — écran admin avancé.

---

## `12_email_server_and_notifications_dashboard.png`

### 1. Nom du fichier
`12_email_server_and_notifications_dashboard.png`

### 2. Type d’écran
Paramétrage serveur mail et notifications.

### 3. Module applicatif concerné
`features/admin`  
Secondairement : `features/notifications`.

### 4. Route probable
`/settings/mail`

### 5. Objectif fonctionnel de l’écran
Configurer l’envoi des emails transactionnels, les domaines, expéditeurs, modèles d’emails, webhooks et surveiller la délivrabilité.

### 6. Layout général
- Shell global Studio Templates.
- KPI cards mail en haut.
- Grille centrale de cards de configuration.
- Right panel avec file d’envoi, incidents, actions rapides et statut service.

### 7. Zones principales
- Header : `Serveur mail & notifications`.
- KPI cards : fournisseur, réputation, taux de délivrabilité, emails envoyés, rebonds, dernières erreurs.
- Configuration : SMTP, authentification domaine, expéditeurs, modèles d’emails, tests & sandbox, webhooks & événements.
- Right panel : file d’envoi, incidents de délivrabilité, envoyer un test, voir les logs, statut du service.

### 8. Composants visibles
- `MailSettingsPage`
- `KpiCard`
- `SmtpConfigCard`
- `DomainAuthCard`
- `SenderListCard`
- `EmailTemplatesCard`
- `SandboxTestCard`
- `WebhookEventsCard`
- `QueueStatusPanel`
- `DeliverabilityIncidentsPanel`
- `ServiceStatusPanel`
- `ActionCard`

### 9. Données affichées
- Fournisseur : `SendGrid`
- Réputation : `98 / 100`
- Taux délivrabilité : `99,2%`
- Emails envoyés : `24 580`
- Rebonds : `0,38%`
- Dernières erreurs : `0`
- SMTP :
  - hôte `smtp.sendgrid.net`
  - port `587`
  - chiffrement `STARTTLS`
  - identifiant masqué
  - domaine d’envoi vérifié
  - adresse de réponse
- Auth domaine :
  - SPF valide
  - DKIM valide
  - DMARC valide
- Expéditeurs :
  - no-reply
  - support
  - facturation
- Modèles :
  - invitation utilisateur
  - réinitialisation de mot de passe
  - notification paiement
  - alerte système
- Webhooks :
  - email délivré
  - email ouvert
  - email en rebond
  - plainte spam
- File d’envoi :
  - 12 en attente
  - 3 en cours

### 10. Actions utilisateur visibles
- Ajouter un expéditeur.
- Envoyer un email de test.
- Prévisualiser un modèle.
- Voir tous les modèles.
- Voir les logs.
- Voir tous les incidents.
- Voir la page de statut.
- Accéder à chaque webhook/template via chevron.

### 11. États UI visibles
- Badges : `Connecté`, `Excellente`, `Valide`, `Vérifié`, `Actif`, `Opérationnel`.
- Alertes rouge/orange.
- Barre de progression file d’envoi.
- Cards avec boutons secondaires bordés.
- Statuts verts sur webhooks et services.

### 12. Composants à créer ou réutiliser
À réutiliser :
- `AppShell`
- `KpiCard`
- `StatusBadge`
- `SectionCard`
- `ProgressBar`
- `ActionListCard`

À créer :
- `MailNotificationsPage`
- `SmtpConfigurationCard`
- `DomainAuthenticationCard`
- `SenderManagementCard`
- `EmailTemplateListCard`
- `MailTestSandboxCard`
- `EmailWebhookEventsCard`
- `MailQueuePanel`
- `DeliverabilityIncidentList`
- `MailServiceStatusCard`

### 13. Contraintes de fidélité visuelle
- Conserver la hiérarchie KPI → configuration → statut.
- Les alertes de délivrabilité doivent rester en colonne droite.
- Les statuts de domaine doivent être visibles.
- Les boutons `Envoyer un test`, `Aperçu`, `Voir les logs` doivent rester accessibles.
- Ne pas mélanger modèles d’emails et notifications persistantes.

### 14. Points d’ambiguïté
- L’écran mélange email transactionnel et notifications ; les notifications persistantes applicatives ne sont pas détaillées ici.
- Provider visible = SendGrid, mais le provider mail n’est pas nécessairement figé.
- Les webhooks email ont probablement un écran détail non visible.

### 15. Priorité d’implémentation
**P2** — important pour exploitation et notifications.

---

## `14_modern_dark_themed_admin_dashboard_ui.png`

### 1. Nom du fichier
`14_modern_dark_themed_admin_dashboard_ui.png`

### 2. Type d’écran
Dashboard LLM, IA & API.

### 3. Module applicatif concerné
`features/ai`  
Secondairement : `features/admin`.

### 4. Route probable
`/settings/ai`

### 5. Objectif fonctionnel de l’écran
Administrer les fournisseurs IA, modèles, quotas, clés API, webhooks, prompts et suivre l’activité IA récente.

### 6. Layout général
- Shell global identique.
- Header + KPI cards IA/API.
- Grille de cards fonctionnelles.
- Colonne droite avec activité IA récente, alertes budget, actions rapides.

### 7. Zones principales
- Header : `LLM, IA & API`.
- KPI : fournisseurs IA actifs, coût mensuel IA, tokens consommés, appels API, webhooks échoués.
- Cards centrales : fournisseurs LLM, routage des modèles, prompt templates, quotas & limites, API, webhooks.
- Right panel : activité IA récente, alertes de budget, actions rapides.

### 8. Composants visibles
- `AiAdminPage`
- `KpiCard`
- `ProviderTableCard`
- `ModelRoutingTable`
- `PromptTemplatesTable`
- `QuotaUsageCard`
- `ApiKeysCard`
- `WebhookSettingsCard`
- `RecentAiActivityPanel`
- `BudgetAlertsPanel`
- `QuickActionPanel`
- `ProgressBar`
- `StatusBadge`

### 9. Données affichées
- Fournisseurs IA actifs : `3 / 5`
- Coût mensuel IA : `2 845,60 €`
- Tokens consommés : `128,7 M`
- Appels API : `1 284 512`
- Webhooks échoués : `7`
- Fournisseurs : OpenAI, Anthropic, Mistral AI.
- Routage modèles :
  - génération CV
  - extraction données
  - matching candidats
  - résumé documents
- Prompt templates :
  - rédaction annonce
  - analyse de CV
  - questions d’entretien
  - résumé de profil
  - synthèse d’entretien
- Quotas :
  - tokens mensuels 64%
  - budget mensuel 57%
  - 2 avertissements actifs
- API :
  - clé masquée
  - environnement production
  - rate limits
  - IP allowlist
- Webhooks :
  - endpoints
  - signature HMAC-SHA256
  - retries
  - statut global
- Activité IA :
  - appel API réussi
  - traitement terminé
  - webhook échec
  - coût mis à jour
  - clé API créée
- Alertes :
  - budget IA à 80%
  - dépassement prévisionnel

### 10. Actions utilisateur visibles
- Gérer les fournisseurs.
- Gérer règles de routage.
- Créer nouveau template de prompt.
- Gérer les quotas.
- Gérer les clés et accès.
- Gérer les webhooks.
- Tester un prompt.
- Générer une clé.
- Voir les journaux.
- Voir toute l’activité.
- Voir toutes les alertes.

### 11. États UI visibles
- Badges verts : `Actif`, `Production`, `Toutes opérationnelles`.
- Badge violet : `HMAC-SHA256`.
- Alertes orange/rouge.
- Progress bars quotas/budget.
- Indicateurs de tendance verts/rouges.
- Cards en grille régulière.

### 12. Composants à créer ou réutiliser
À réutiliser :
- `AppShell`
- `KpiCard`
- `DataTable`
- `ProgressBar`
- `StatusBadge`
- `RightPanel`
- `QuickActionList`

À créer :
- `AiSettingsPage`
- `LlmProviderListCard`
- `ModelRoutingCard`
- `PromptTemplateListCard`
- `AiQuotaLimitsCard`
- `ApiAccessCard`
- `AiWebhookCard`
- `AiRecentActivityPanel`
- `AiBudgetAlertsPanel`
- `AiQuickActionsPanel`

### 13. Contraintes de fidélité visuelle
- Respecter les trois colonnes centrales de cards.
- Les tables doivent rester compactes et lisibles.
- Les quotas doivent afficher des barres de progression.
- Le right panel doit rester dédié activité/alertes/actions.
- Ne pas simplifier les prompts ou providers en simples listes.
- Ne pas confondre `/settings/ai` avec le workspace fonctionnel IA `/ai`.

### 14. Points d’ambiguïté
- La route pourrait aussi être `/ai`, mais recommandation : `/settings/ai` pour cette capture.
- Les fournisseurs affichés sont des exemples.
- L’action `Tester un prompt` implique probablement un prompt playground non visible ici.

### 15. Priorité d’implémentation
**P1** — important car l’IA par champ est un axe structurant du produit.

---

## `17_modern_payments_and_billing_dashboard_ui.png`

### 1. Nom du fichier
`17_modern_payments_and_billing_dashboard_ui.png`

### 2. Type d’écran
Paramétrage paiements et facturation.

### 3. Module applicatif concerné
`features/payments`  
Secondairement : `features/admin`.

### 4. Route probable
`/settings/payments`

### 5. Objectif fonctionnel de l’écran
Configurer les passerelles de paiement, méthodes de paiement, plans d’abonnement, facturation, fiscalité, recouvrement et webhooks paiements.

### 6. Layout général
- Shell global.
- Page principale avec KPI en haut.
- Sections en cards horizontales.
- Colonne droite avec factures récentes, statut taxes et actions rapides.

### 7. Zones principales
- Header : `Paiements & facturation`.
- KPI : MRR, taux de réussite, abonnements actifs, panier moyen, remboursements.
- Passerelles : Stripe, GoCardless, PayPal.
- Méthodes : carte bancaire, prélèvement SEPA, virement bancaire.
- Abonnements & plans : Starter, Pro, Enterprise.
- Facturation : numérotation, délai de paiement, TVA, pays taxables.
- Règles de recouvrement : retries/dunning, emails de relance.
- Webhooks paiements : événements reçus, santé endpoints.
- Right panel : factures récentes, statut des taxes, actions rapides.

### 8. Composants visibles
- `PaymentsBillingSettingsPage`
- `KpiCard`
- `PaymentGatewayCard`
- `PaymentMethodCard`
- `SubscriptionPlanCard`
- `BillingSettingsCard`
- `RecoveryRulesCard`
- `PaymentWebhooksCard`
- `RecentInvoicesPanel`
- `TaxStatusPanel`
- `QuickActionPanel`
- `StatusBadge`

### 9. Données affichées
- MRR : `24 580 €`
- Taux réussite : `98,7%`
- Abonnements actifs : `1 248`
- Panier moyen : `46,80 €`
- Remboursements : `320 €`
- Gateways :
  - Stripe actif production
  - GoCardless actif sandbox
  - PayPal actif production
- Méthodes :
  - carte bancaire acceptée 98,6%
  - SEPA 96,3%
  - virement manuel
- Plans :
  - Starter 19€/mois
  - Pro 49€/mois
  - Enterprise 149€/mois / sur devis
- Factures récentes : FAC-2024-0158 à FAC-2024-0154
- Taxes : TVA FR, TVA UE, TVA UK, Sales Tax US, GST Canada
- Actions : créer un plan, ouvrir portail client, générer facture, accéder dashboard paiements, exporter factures.

### 10. Actions utilisateur visibles
- Gérer chaque passerelle.
- Créer un plan.
- Ouvrir le portail client.
- Générer une facture.
- Accéder au tableau de bord paiements.
- Exporter les factures.
- Accéder aux lignes via menu trois points ou chevrons.

### 11. États UI visibles
- Badges : `Actif`, `Production`, `Sandbox`, `Payée`, `En attente`, `Échouée`, `Inactive`.
- KPI avec tendances positives/négatives.
- Cards de plans avec prix.
- Right panel structuré.

### 12. Composants à créer ou réutiliser
À réutiliser :
- `AppShell`
- `KpiCard`
- `StatusBadge`
- `SectionCard`
- `QuickActionList`

À créer :
- `PaymentsBillingPage`
- `PaymentGatewayGrid`
- `PaymentGatewayCard`
- `PaymentMethodsGrid`
- `SubscriptionPlansGrid`
- `BillingConfigurationCard`
- `RecoveryRulesCard`
- `PaymentWebhooksCard`
- `RecentInvoicesPanel`
- `TaxStatusPanel`

### 13. Contraintes de fidélité visuelle
- Conserver la distinction entre passerelles, méthodes, plans, facturation, recouvrement.
- Ne pas réduire à une seule table.
- Les gateways doivent rester en cards horizontales.
- Le right panel doit rester visible.
- Les statuts production/sandbox doivent être clairement différenciés.

### 14. Points d’ambiguïté
- Les providers Stripe/GoCardless/PayPal sont visibles comme exemples.
- Les actions de paiement nécessitent probablement confirmations ou permissions.
- Les tarifs affichés sont des données d’exemple.

### 15. Priorité d’implémentation
**P2** — utile pour admin/platform, après core editor/export/IA.

---

## `23_payment_tracking_dashboard_overview.png`

### 1. Nom du fichier
`23_payment_tracking_dashboard_overview.png`

### 2. Type d’écran
Suivi opérationnel des règlements / transactions.

### 3. Module applicatif concerné
`features/payments`

### 4. Route probable
`/payments`

### 5. Objectif fonctionnel de l’écran
Suivre les transactions, factures, abonnements, remboursements, litiges et incidents de paiement avec filtres et reporting.

### 6. Layout général
- Shell global.
- Header + KPI row.
- Bande de filtres.
- Table centrale de transactions.
- Cards analytiques en bas.
- Colonne droite avec événements, export/rapports, actions rapides.

### 7. Zones principales
- KPI : encaissé ce mois, paiements en attente, impayés, remboursements, litiges.
- Filtres : période, statut, mode de paiement, client, réinitialiser.
- Table transactions : date, client, montant, mode, facture, abonnement, statut, référence, actions.
- Bas de page : factures en retard, échecs récents, abonnements à risque, encaissements sur 30 jours.
- Right panel : derniers événements paiement, export & rapports, actions rapides.

### 8. Composants visibles
- `PaymentTrackingPage`
- `KpiCard`
- `FilterBar`
- `DateRangePicker`
- `Select`
- `SearchInput`
- `DataTable`
- `StatusBadge`
- `Pagination`
- `MiniListCard`
- `LineChartCard`
- `PaymentEventsPanel`
- `ExportReportPanel`
- `QuickActionButton`

### 9. Données affichées
- Encaissé ce mois : `24 580 €`
- Paiements en attente : `6 820 €`
- Impayés : `3 450 €`
- Remboursements : `1 120 €`
- Litiges : `650 €`
- Transactions : Société ABC, Design Studio, Tech Innov, Agence Horizon, StartupLab, Forma Plus, Global Consulting, Alpha Corp.
- Statuts : payé, en attente, échoué, impayé.
- Export : période mois en cours, date range, exporter le rapport.
- Actions rapides : exporter CSV, relancer les impayés, créer un avoir.

### 10. Actions utilisateur visibles
- Filtrer par période.
- Filtrer par statut.
- Filtrer par mode de paiement.
- Rechercher client.
- Réinitialiser les filtres.
- Paginer.
- Exporter rapport.
- Exporter CSV.
- Relancer impayés.
- Créer un avoir.
- Voir tous les événements.
- Voir toutes les factures/échecs/abonnements.

### 11. États UI visibles
- Badges paiement : `Payé`, `En attente`, `Échoué`, `Impayé`.
- KPI avec statuts colorés.
- Pagination active.
- Card `Relancer les impayés` mise en avant.
- Card `Créer un avoir` en vert.
- Mini chart ligne pour encaissements.

### 12. Composants à créer ou réutiliser
À réutiliser :
- `AppShell`
- `KpiCard`
- `DataTable`
- `StatusBadge`
- `ChartCard`

À créer :
- `PaymentTrackingPage`
- `PaymentFilterBar`
- `TransactionsTable`
- `PaymentEventsPanel`
- `PaymentExportPanel`
- `LateInvoicesCard`
- `RecentFailuresCard`
- `RiskySubscriptionsCard`
- `RevenueTrendChart`

### 13. Contraintes de fidélité visuelle
- La table doit rester l’élément central.
- Le right panel doit rester en colonne dédiée.
- Les cards du bas doivent être alignées en grille.
- Les filtres doivent être horizontaux au-dessus de la table.
- Utiliser `visx` pour le graphe, pas Recharts.

### 14. Points d’ambiguïté
- Certaines actions demandent probablement confirmations ou modales non visibles.
- La route pourrait être `/payments/tracking`, mais recommandation : `/payments`.

### 15. Priorité d’implémentation
**P2** — écran transactionnel important après fondations tables/paiements.

---

## `24_saas_admin_dashboard_with_settings_panel.png`

### 1. Nom du fichier
`24_saas_admin_dashboard_with_settings_panel.png`

### 2. Type d’écran
Paramètres généraux de l’application.

### 3. Module applicatif concerné
`features/admin`

### 4. Route probable
`/settings/general`

### 5. Objectif fonctionnel de l’écran
Configurer les paramètres globaux de l’application, de l’organisation, du branding, des langues, des modules activés, des notifications globales et de la sauvegarde/maintenance.

### 6. Layout général
- Shell global Studio Templates.
- Main content en grille deux colonnes de cards settings.
- Right panel de publication et checklist des paramètres requis.

### 7. Zones principales
- Header : `Paramètres généraux`.
- Cards centrales : organisation, branding, localisation & langues, modules activés, notifications globales, sauvegarde & maintenance.
- Right panel : état de publication, dernière modification, boutons enregistrer/publier, paramètres requis, message de complétion.

### 8. Composants visibles
- `GeneralSettingsPage`
- `SettingsCard`
- `SettingsRow`
- `StatusBadge`
- `Toggle`
- `ColorSwatch`
- `LogoPreview`
- `RightPublishPanel`
- `ChecklistPanel`
- `ActionButton`

### 9. Données affichées
- Organisation :
  - nom organisation
  - domaine
  - fuseau horaire
  - devise
  - environnement production
- Branding :
  - logo
  - couleur primaire `#6366F1`
  - favicon
  - nom public
- Localisation :
  - langue par défaut français
  - format date
  - format devise
  - pays actifs
- Modules activés :
  - recrutement
  - templates
  - workflows
  - paiements
  - IA
- Notifications globales :
  - emails système
  - alertes critiques
  - résumé quotidien
- Sauvegarde :
  - automatique à 02:00
  - rétention 30 jours
  - fenêtre maintenance dimanche 03:00-05:00
- Publication :
  - publié
  - dernière modification Lucas Dupont
- Checklist : 6/6 complétés

### 10. Actions utilisateur visibles
- Modifier logo/couleur/favicon.
- Ouvrir les lignes de paramètres via chevrons.
- Activer/désactiver notifications globales.
- Enregistrer.
- Publier.
- Accéder aux sections requises.
- Ouvrir domaine externe.

### 11. États UI visibles
- Badges : `Production`, `Activé`, `Publié`.
- Toggles activés en violet.
- Checklist complète en vert.
- Bouton principal violet `Enregistrer`.
- Bouton secondaire `Publier`.
- Message final vert indiquant que la plateforme est prête.

### 12. Composants à créer ou réutiliser
À réutiliser :
- `AppShell`
- `SectionCard`
- `StatusBadge`
- `Toggle`
- `Button`

À créer :
- `GeneralSettingsPage`
- `SettingsGrid`
- `OrganizationSettingsCard`
- `BrandingSettingsCard`
- `LocalizationSettingsCard`
- `EnabledModulesCard`
- `GlobalNotificationsCard`
- `BackupMaintenanceCard`
- `PublishStatePanel`
- `RequiredSettingsChecklist`

### 13. Contraintes de fidélité visuelle
- Garder la structure cards deux colonnes + right panel.
- Les lignes de paramètres doivent rester cliquables avec chevron.
- Le panneau publication doit rester visible à droite.
- Les toggles doivent être violets.
- Ne pas transformer cet écran en formulaire vertical classique.

### 14. Points d’ambiguïté
- Certaines lignes ouvrent probablement des modales ou sous-pages non visibles.
- `Publier` peut concerner configuration globale ou mise en production des settings.
- Les notifications globales sont distinctes du centre de notifications persistant.

### 15. Priorité d’implémentation
**P1** — écran de settings central.

---

# Synthèse globale du lot

## Mapping écran → route → feature

| Image | Route recommandée | Feature principale | Features secondaires | Priorité |
|---|---|---|---|---|
| `02_admin_dashboard_with_system_health_overview.png` | `/admin` | `features/admin` | `features/notifications`, `features/exports`, `features/payments`, `features/ai` | P1 |
| `11_dark_themed_database_admin_dashboard_ui.png` | `/settings/database` | `features/admin` | `features/exports` | P2 |
| `12_email_server_and_notifications_dashboard.png` | `/settings/mail` | `features/admin` | `features/notifications` | P2 |
| `14_modern_dark_themed_admin_dashboard_ui.png` | `/settings/ai` | `features/ai` | `features/admin` | P1 |
| `17_modern_payments_and_billing_dashboard_ui.png` | `/settings/payments` | `features/payments` | `features/admin` | P2 |
| `23_payment_tracking_dashboard_overview.png` | `/payments` | `features/payments` | `features/notifications`, `features/exports` | P2 |
| `24_saas_admin_dashboard_with_settings_panel.png` | `/settings/general` | `features/admin` | `features/notifications` | P1 |

---

# Routes recommandées

```txt
/admin
/admin/system-health
/settings
/settings/general
/settings/database
/settings/mail
/settings/ai
/settings/api
/settings/payments
/settings/billing
/payments
/payments/tracking
/payments/invoices
/payments/subscriptions
/payments/webhooks


---

# SCREEN_DESCRIPTIONS 2.md

# Lot 2 — Authentification — Screen Descriptions

## Écrans analysés

- `15_modern_password_reset_and_security_interface.png`
- `16_modern_password_reset_ui_mockup.png`
- `20_modern_saas_signup_and_dashboard_ui.png`
- `21_modern_verification_ui_design_mockup.png`
- `22_modern_web_app_login_interface_design.png`

---

## `15_modern_password_reset_and_security_interface.png`

### 1. Nom du fichier
`15_modern_password_reset_and_security_interface.png`

### 2. Type d’écran
Réinitialisation du mot de passe avec indicateur de sécurité.

### 3. Module applicatif concerné
`features/auth`

### 4. Route probable
`/reset-password`

### 5. Objectif fonctionnel de l’écran
Permettre à l’utilisateur de définir un nouveau mot de passe sécurisé après avoir suivi un lien de réinitialisation.

### 6. Layout général
- Écran split-screen en deux colonnes.
- Bandeau supérieur sombre avec logo `Studio Templates`.
- Colonne gauche illustrée, orientée confiance/sécurité.
- Colonne droite avec carte blanche centrée contenant le formulaire.
- Footer discret sous la carte avec copyright et liens légaux.

### 7. Zones principales
- Header global :
  - logo Studio Templates en haut à gauche.
- Partie gauche :
  - titre marketing : `Sécurité renforcée, simplicité garantie.`
  - texte d’accompagnement.
  - grande illustration bouclier/cadenas.
  - cartes flottantes de réassurance :
    - `Données sécurisées`
    - `Confidentialité prioritaire`
    - `Contrôle total`
    - `Accès fiable`
- Partie droite :
  - carte formulaire.
  - logo dans la carte.
  - titre : `Réinitialiser le mot de passe`.
  - sous-texte explicatif.
  - champ nouveau mot de passe.
  - champ confirmation.
  - indicateur de force du mot de passe.
  - critères de sécurité.
  - bouton principal.
  - lien retour connexion.
- Footer :
  - copyright.
  - liens `Confidentialité` et `Conditions d'utilisation`.

### 8. Composants visibles
- `AuthLayout`
- `AuthBrandHeader`
- `AuthIllustrationPanel`
- `AuthCard`
- `PasswordInput`
- `PasswordStrengthMeter`
- `PasswordRequirementList`
- `Button`
- `Link`
- `SecurityFeatureBadge`
- `FooterLinks`

### 9. Données affichées
- Nom produit : `Studio Templates`
- Titre : `Réinitialiser le mot de passe`
- Champs :
  - `Nouveau mot de passe`
  - `Confirmer le mot de passe`
- Force du mot de passe : `Fort`
- Critères :
  - au moins 8 caractères
  - inclut un chiffre
  - inclut une majuscule
  - inclut un caractère spécial
- CTA : `Mettre à jour le mot de passe`
- Lien : `Retour à la connexion`

### 10. Actions utilisateur visibles
- Saisir un nouveau mot de passe.
- Afficher/masquer le mot de passe via icône œil.
- Confirmer le mot de passe.
- Soumettre le nouveau mot de passe.
- Retourner à la page de connexion.

### 11. États UI visibles
- Champs mot de passe remplis avec caractères masqués.
- Force du mot de passe affichée comme `Fort`.
- Barre de force partiellement/fortement remplie en violet.
- Critères de sécurité validés avec icônes vertes.
- Bouton principal violet actif.
- Carte formulaire en état normal, sans erreur affichée.

### 12. Composants à créer ou réutiliser
À réutiliser :
- `AuthLayout`
- `AuthCard`
- `PasswordInput`
- `Button`
- `Kbd` si raccourcis visibles plus tard
- `FooterLinks`

À créer :
- `ResetPasswordPage`
- `AuthSecurityIllustrationPanel`
- `PasswordStrengthMeter`
- `PasswordRequirementList`
- `SecurityFeatureBadge`

### 13. Contraintes de fidélité visuelle
- Conserver le layout split-screen.
- Conserver le header sombre avec logo.
- Reproduire la grande illustration sécurité à gauche.
- Garder la carte formulaire centrée à droite.
- Respecter l’accent violet pour les mots importants et le bouton principal.
- Les critères de mot de passe doivent être visibles sous la jauge.
- Ne pas réduire cet écran à un formulaire simple.

### 14. Points d’ambiguïté
- Le token de réinitialisation n’est pas visible, mais il doit être géré côté logique.
- L’écran ne montre pas les états d’erreur : token expiré, mot de passe non conforme, confirmation différente.
- Les visuels de gauche peuvent être reproduits via illustration statique ou composition UI simplifiée.

### 15. Priorité d’implémentation
**P1** — écran auth important, à implémenter avec Better Auth et validation Zod.

---

## `16_modern_password_reset_ui_mockup.png`

### 1. Nom du fichier
`16_modern_password_reset_ui_mockup.png`

### 2. Type d’écran
Mot de passe oublié / demande de lien de réinitialisation.

### 3. Module applicatif concerné
`features/auth`

### 4. Route probable
`/forgot-password`

### 5. Objectif fonctionnel de l’écran
Permettre à l’utilisateur de demander un lien sécurisé de réinitialisation par e-mail.

### 6. Layout général
- Écran split-screen.
- Bandeau supérieur sombre avec logo.
- Colonne gauche illustrative orientée récupération d’accès et sécurité.
- Colonne droite avec carte de formulaire centrée.
- Card d’aide sous le formulaire.
- Footer avec copyright et liens légaux.

### 7. Zones principales
- Header :
  - logo Studio Templates.
- Colonne gauche :
  - titre : `Récupérez l’accès à votre compte en toute sécurité.`
  - texte : envoi d’un lien sécurisé par e-mail.
  - illustration laptop + cadenas + enveloppe.
  - badges flottants de sécurité.
- Colonne droite :
  - carte formulaire.
  - logo Studio Templates.
  - titre : `Mot de passe oublié`
  - texte d’aide.
  - champ adresse e-mail.
  - bouton principal.
  - séparateur `ou`.
  - lien retour connexion.
- Card d’aide :
  - `Vous ne recevez pas l'e-mail ?`
  - conseils spam/courrier indésirable.
  - validité du lien 15 minutes.
- Footer :
  - copyright.
  - confidentialité.
  - conditions d’utilisation.

### 8. Composants visibles
- `AuthLayout`
- `AuthIllustrationPanel`
- `AuthCard`
- `EmailInput`
- `Button`
- `Divider`
- `HelpCard`
- `FooterLinks`
- `IconBadge`

### 9. Données affichées
- Titre marketing : `Récupérez l’accès à votre compte en toute sécurité.`
- Titre formulaire : `Mot de passe oublié`
- Champ : `Adresse e-mail`
- Placeholder : `votre@email.com`
- CTA : `Envoyer le lien de réinitialisation`
- Lien : `Retour à la connexion`
- Aide :
  - `Vous ne recevez pas l'e-mail ?`
  - `Vérifiez votre dossier spam ou courrier indésirable.`
  - `Le lien est valable pendant 15 minutes.`

### 10. Actions utilisateur visibles
- Saisir une adresse e-mail.
- Envoyer le lien de réinitialisation.
- Retourner à la connexion.

### 11. États UI visibles
- Champ e-mail vide avec placeholder.
- Bouton principal actif.
- Card d’aide informative avec icône verte.
- Aucun état d’erreur visible.
- Aucun état de succès post-envoi visible.

### 12. Composants à créer ou réutiliser
À réutiliser :
- `AuthLayout`
- `AuthCard`
- `EmailInput`
- `Button`
- `Divider`
- `FooterLinks`

À créer :
- `ForgotPasswordPage`
- `AuthRecoveryIllustrationPanel`
- `AuthHelpCard`

### 13. Contraintes de fidélité visuelle
- Conserver la séparation visuelle entre illustration gauche et formulaire droit.
- Garder le style calme, rassurant, orienté sécurité.
- Le bloc d’aide sous le formulaire doit être visible.
- Le bouton principal doit occuper toute la largeur du formulaire.
- Ne pas fusionner l’aide avec le formulaire principal.

### 14. Points d’ambiguïté
- L’écran ne montre pas l’état après envoi réussi.
- Le provider d’e-mail n’est pas visible.
- Le délai de validité du lien est visible comme `15 minutes`, à reprendre dans les textes.

### 15. Priorité d’implémentation
**P1** — écran auth standard indispensable.

---

## `20_modern_saas_signup_and_dashboard_ui.png`

### 1. Nom du fichier
`20_modern_saas_signup_and_dashboard_ui.png`

### 2. Type d’écran
Création de compte / inscription.

### 3. Module applicatif concerné
`features/auth`

### 4. Route probable
`/signup`

### 5. Objectif fonctionnel de l’écran
Permettre à un nouvel utilisateur de créer un compte Studio Templates avec e-mail/mot de passe ou via providers OAuth.

### 6. Layout général
- Écran split-screen avec header sombre.
- Colonne gauche très orientée produit :
  - promesse,
  - capture de l’éditeur,
  - carte flottante de bénéfices.
- Colonne droite :
  - carte d’inscription complète.
  - formulaire multi-champs.
  - boutons OAuth.
  - lien vers connexion.
- Footer en bas de colonne droite.

### 7. Zones principales
- Header :
  - logo Studio Templates.
- Colonne gauche :
  - titre : `Lancez votre espace Studio Templates`
  - texte produit.
  - grande capture de l’éditeur CV/template.
  - carte flottante `Prêt à démarrer`.
- Colonne droite :
  - carte signup.
  - logo.
  - titre : `Créer un compte`
  - sous-titre.
  - champs prénom et nom en deux colonnes.
  - champ adresse e-mail.
  - champ mot de passe.
  - champ confirmation mot de passe.
  - checkbox acceptation CGU / confidentialité.
  - bouton principal.
  - séparateur `ou`.
  - boutons OAuth Google et Microsoft.
  - lien vers connexion.
- Footer :
  - copyright et liens légaux.

### 8. Composants visibles
- `AuthLayout`
- `AuthProductPanel`
- `AuthCard`
- `TextInput`
- `EmailInput`
- `PasswordInput`
- `Checkbox`
- `Button`
- `OAuthButton`
- `Divider`
- `FooterLinks`
- `ProductPreviewMockup`
- `BenefitCard`

### 9. Données affichées
- Titre produit : `Lancez votre espace Studio Templates`
- Titre formulaire : `Créer un compte`
- Champs :
  - `Prénom`
  - `Nom`
  - `Adresse e-mail`
  - `Mot de passe`
  - `Confirmer le mot de passe`
- Placeholder :
  - `Votre prénom`
  - `Votre nom`
  - `votre@email.com`
  - `Créez un mot de passe`
  - `Confirmez votre mot de passe`
- Aide mot de passe :
  - `Minimum 8 caractères avec une majuscule, un chiffre et un symbole.`
- Checkbox :
  - acceptation conditions d’utilisation et politique de confidentialité.
- CTA :
  - `Créer mon compte`
- OAuth :
  - `Continuer avec Google`
  - `Continuer avec Microsoft`
- Lien :
  - `Vous avez déjà un compte ? Se connecter`

### 10. Actions utilisateur visibles
- Saisir prénom, nom, e-mail, mot de passe, confirmation.
- Afficher/masquer les mots de passe.
- Accepter les conditions.
- Créer un compte.
- Continuer avec Google.
- Continuer avec Microsoft.
- Aller vers la connexion.

### 11. États UI visibles
- Checkbox CGU cochée.
- Bouton principal violet actif.
- Champs vides avec placeholders.
- Boutons OAuth secondaires.
- Aucun état d’erreur visible.
- Carte bénéfices à gauche avec éléments validés.

### 12. Composants à créer ou réutiliser
À réutiliser :
- `AuthLayout`
- `AuthCard`
- `TextInput`
- `EmailInput`
- `PasswordInput`
- `Checkbox`
- `Button`
- `OAuthButton`
- `Divider`
- `FooterLinks`

À créer :
- `SignupPage`
- `SignupForm`
- `AuthProductPreviewPanel`
- `ProductPreviewMockup`
- `BenefitChecklistCard`

### 13. Contraintes de fidélité visuelle
- Le panneau gauche doit mettre en avant l’éditeur Studio Templates.
- Le formulaire doit rester dans une grande card blanche.
- Les champs prénom/nom doivent rester sur la même ligne en desktop.
- Garder les boutons OAuth séparés du CTA principal par un diviseur.
- Ne pas supprimer l’acceptation CGU.
- Garder l’accent violet sur le titre et le bouton.

### 14. Points d’ambiguïté
- Le screenshot montre un aperçu produit à gauche ; en V1, il peut être une image statique ou un composant mocké.
- Le processus post-signup n’est pas visible : vérification e-mail, onboarding ou redirection dashboard.
- Les providers OAuth affichés sont Google et Microsoft ; à confirmer avec Better Auth.

### 15. Priorité d’implémentation
**P1** — écran principal d’acquisition utilisateur.

---

## `21_modern_verification_ui_design_mockup.png`

### 1. Nom du fichier
`21_modern_verification_ui_design_mockup.png`

### 2. Type d’écran
Vérification en deux étapes / OTP.

### 3. Module applicatif concerné
`features/auth`

### 4. Route probable
`/two-factor`  
ou `/verify`

### 5. Objectif fonctionnel de l’écran
Permettre à l’utilisateur de saisir un code à 6 chiffres envoyé par e-mail pour valider son identité ou finaliser une connexion sécurisée.

### 6. Layout général
- Écran split-screen.
- Header sombre.
- Colonne gauche avec promesse produit et capture de l’éditeur.
- Colonne droite avec carte OTP centrée.
- Footer sous la carte.

### 7. Zones principales
- Header :
  - logo Studio Templates.
- Colonne gauche :
  - titre : `Créez, personnalisez et publiez vos templates en toute simplicité.`
  - texte produit.
  - capture de l’éditeur CV/template.
- Colonne droite :
  - carte vérification.
  - logo.
  - titre : `Vérification en 2 étapes`
  - texte explicatif.
  - bloc e-mail masqué.
  - input OTP à 6 cases.
  - timer de renvoi.
  - lien `Renvoyer le code`.
  - bouton principal `Vérifier`.
  - séparateur `ou`.
  - lien autre méthode.
- Footer :
  - copyright.
  - liens confidentialité et conditions.

### 8. Composants visibles
- `AuthLayout`
- `AuthProductPanel`
- `AuthCard`
- `OtpInput`
- `MaskedEmailBadge`
- `CountdownTimer`
- `Button`
- `Divider`
- `Link`
- `FooterLinks`
- `ProductPreviewMockup`

### 9. Données affichées
- Titre : `Vérification en 2 étapes`
- Message : code à 6 chiffres envoyé à une adresse e-mail.
- Email masqué : `•••••••@email.com`
- OTP : 6 champs.
- Timer : `00:45`
- Actions :
  - `Renvoyer le code`
  - `Vérifier`
  - `Utiliser une autre méthode`

### 10. Actions utilisateur visibles
- Saisir un code OTP à 6 chiffres.
- Renvoyer le code.
- Vérifier le code.
- Utiliser une autre méthode.

### 11. États UI visibles
- Premier champ OTP focus avec bordure violette.
- Timer actif avant renvoi.
- Bouton principal violet.
- Aucun état d’erreur visible.
- Aucun état succès visible.

### 12. Composants à créer ou réutiliser
À réutiliser :
- `AuthLayout`
- `AuthCard`
- `Button`
- `Divider`
- `FooterLinks`
- `ProductPreviewMockup`

À créer :
- `TwoFactorVerificationPage`
- `OtpVerificationForm`
- `MaskedEmailBadge`
- `ResendCodeTimer`

Bibliothèque à utiliser :
- `input-otp`

### 13. Contraintes de fidélité visuelle
- Utiliser `input-otp` pour les 6 cases OTP.
- Conserver le focus violet sur la case active.
- Le bloc e-mail masqué doit rester visible.
- Garder les actions renvoi / autre méthode.
- Ne pas remplacer l’OTP par un champ texte unique.

### 14. Points d’ambiguïté
- Le canal OTP visible est e-mail, mais il peut aussi être utilisé pour 2FA.
- L’écran ne montre pas les états code invalide, expiré ou renvoi réussi.
- La route peut être `/two-factor`, `/verify`, ou `/auth/verify`; recommandation : `/two-factor`.

### 15. Priorité d’implémentation
**P1** — important si 2FA / vérification par code est retenu.

---

## `22_modern_web_app_login_interface_design.png`

### 1. Nom du fichier
`22_modern_web_app_login_interface_design.png`

### 2. Type d’écran
Connexion.

### 3. Module applicatif concerné
`features/auth`

### 4. Route probable
`/login`

### 5. Objectif fonctionnel de l’écran
Permettre à un utilisateur existant de se connecter avec e-mail/mot de passe ou via providers OAuth.

### 6. Layout général
- Écran split-screen.
- Header sombre avec logo.
- Colonne gauche avec promesse produit et capture de l’éditeur.
- Colonne droite avec carte de connexion.
- Footer sous la carte.

### 7. Zones principales
- Header :
  - logo Studio Templates.
- Colonne gauche :
  - titre : `Créez, personnalisez et publiez vos templates en toute simplicité.`
  - texte produit.
  - capture de l’éditeur CV/template.
  - carte flottante `Publication`.
- Colonne droite :
  - carte login.
  - logo.
  - titre : `Connexion`
  - sous-titre.
  - champ e-mail.
  - champ mot de passe.
  - checkbox `Se souvenir de moi`.
  - lien mot de passe oublié.
  - bouton principal.
  - séparateur `ou`.
  - boutons OAuth Google et Microsoft.
  - lien création de compte.
- Footer :
  - copyright.
  - confidentialité.
  - conditions d’utilisation.

### 8. Composants visibles
- `AuthLayout`
- `AuthProductPanel`
- `AuthCard`
- `EmailInput`
- `PasswordInput`
- `Checkbox`
- `Button`
- `OAuthButton`
- `Divider`
- `Link`
- `FooterLinks`
- `ProductPreviewMockup`
- `FloatingStatusCard`

### 9. Données affichées
- Titre produit : `Créez, personnalisez et publiez vos templates en toute simplicité.`
- Titre formulaire : `Connexion`
- Champs :
  - `Adresse e-mail`
  - `Mot de passe`
- Placeholder :
  - `votre@email.com`
- Options :
  - `Se souvenir de moi`
  - `Mot de passe oublié ?`
- CTA :
  - `Se connecter`
- OAuth :
  - `Continuer avec Google`
  - `Continuer avec Microsoft`
- Lien :
  - `Vous n’avez pas de compte ? Créer un compte`
- Carte flottante :
  - `Publication`
  - vérification des données
  - aperçu responsive
  - optimisation des assets
  - bouton `Publier le template`

### 10. Actions utilisateur visibles
- Saisir e-mail.
- Saisir mot de passe.
- Afficher/masquer le mot de passe.
- Cocher/décocher se souvenir de moi.
- Aller vers mot de passe oublié.
- Se connecter.
- Se connecter avec Google.
- Se connecter avec Microsoft.
- Aller vers création de compte.

### 11. États UI visibles
- Checkbox `Se souvenir de moi` cochée.
- Champ mot de passe rempli/masqué.
- Bouton principal violet actif.
- OAuth en boutons secondaires.
- Aucun état d’erreur visible.
- Carte gauche de publication avec checks verts.

### 12. Composants à créer ou réutiliser
À réutiliser :
- `AuthLayout`
- `AuthCard`
- `EmailInput`
- `PasswordInput`
- `Checkbox`
- `Button`
- `OAuthButton`
- `Divider`
- `FooterLinks`
- `ProductPreviewMockup`

À créer :
- `LoginPage`
- `LoginForm`
- `AuthProductPanel`
- `FloatingPublicationCard`

### 13. Contraintes de fidélité visuelle
- Respecter le split-screen.
- Conserver la capture produit à gauche.
- Garder la card de connexion large et centrée.
- Le lien `Mot de passe oublié ?` doit rester aligné à droite de la ligne `Se souvenir de moi`.
- Les boutons OAuth doivent rester sous le séparateur.
- Ne pas supprimer la carte flottante de publication.

### 14. Points d’ambiguïté
- Les providers Google/Microsoft doivent être confirmés dans Better Auth.
- Le comportement `Se souvenir de moi` n’est pas détaillé.
- L’écran ne montre pas les erreurs d’identifiants invalides, compte bloqué ou 2FA requis.

### 15. Priorité d’implémentation
**P1** — écran d’entrée principal.

---

# Synthèse globale du lot

## Mapping écran → route → feature

| Image | Route recommandée | Feature principale | Priorité |
|---|---|---|---|
| `22_modern_web_app_login_interface_design.png` | `/login` | `features/auth` | P1 |
| `20_modern_saas_signup_and_dashboard_ui.png` | `/signup` | `features/auth` | P1 |
| `16_modern_password_reset_ui_mockup.png` | `/forgot-password` | `features/auth` | P1 |
| `15_modern_password_reset_and_security_interface.png` | `/reset-password` | `features/auth` | P1 |
| `21_modern_verification_ui_design_mockup.png` | `/two-factor` | `features/auth` | P1 |

---

# Routes recommandées

```txt
/login
/signup
/forgot-password
/reset-password
/two-factor


---

# SCREEN_DESCRIPTIONS 3.md

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


---

# SCREEN_DESCRIPTIONS 4.md

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


---

# SCREEN_DESCRIPTIONS 5.md

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
