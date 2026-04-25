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