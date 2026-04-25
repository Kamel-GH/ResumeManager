# AGENTS.md — Feature Admin

## Rôle
Ce module couvre l’administration et les paramétrages techniques de l’application.
Il doit être complet, crédible, exploitable et cohérent avec le cœur produit.
Il ne doit jamais prendre le pas sur l’éditeur comme centre du produit.

## Stack locale obligatoire
Respecter `STACK_IMPOSEE.md`, notamment :
- Better Auth pour auth, sessions, rôles, permissions ;
- TanStack Table / TanStack Virtual pour tables admin ;
- visx pour graphiques admin ;
- Sentry pour erreurs/exceptions ;
- Pino pour logs structurés ;
- AWS SDK v3 pour S3-compatible storage ;
- Sonner pour feedback instantané ;
- PostgreSQL + Prisma pour persistance ;
- Playwright / Vitest pour tests.

## Périmètre admin obligatoire
Implémenter les écrans / modules suivants quand ils sont dans le périmètre :
- administration & paramétrages ;
- paramètres généraux ;
- utilisateurs & rôles ;
- base de données ;
- serveur mail & notifications ;
- LLM / IA / API ;
- paiements & facturation ;
- suivi des règlements ;
- storage S3-compatible ;
- logs & audits ;
- jobs & exports ;
- sécurité ;
- supervision ;
- santé système.

## Paramètres généraux
Prévoir :
- organisation ;
- branding ;
- langues/localisation ;
- modules activés ;
- notifications globales ;
- sauvegarde & maintenance.

## Utilisateurs & rôles
Prévoir :
- gestion des comptes ;
- rôles ;
- permissions ;
- invitations ;
- règles d’accès ;
- sessions ;
- politiques d’accès ;
- 2FA / OTP si activé ;
- sécurité Better Auth.

## Base de données
La base de données doit être pensée comme un module robuste, finement gérable et administrable.

Prévoir :
- architecture propre de persistance ;
- schéma clair ;
- migrations ;
- validations ;
- gestion d’erreurs ;
- logs ;
- séparation environnement dev / staging / prod ;
- sauvegardes ;
- restauration ;
- monitoring ;
- santé ;
- maintenance ;
- jobs techniques ;
- auditabilité minimale.

## Serveur mail & notifications
Prévoir :
- configuration technique ;
- expéditeurs ;
- domaines ;
- modèles ;
- tests ;
- événements / livraisons si visibles dans les écrans ;
- supervision minimale ;
- notification center persistant en lien avec `features/notifications`.

## LLM / IA / API
Respecter les exigences de `features/ai/AGENTS.md` quand elles s’appliquent en administration.

Prévoir :
- fournisseurs ;
- modèles ;
- prompts ;
- clés / secrets ;
- quotas ;
- budgets ;
- routage ;
- fallback ;
- monitoring ;
- logs ;
- API / webhooks.

## Storage S3-compatible
Prévoir :
- configuration endpoint/bucket/region ;
- tests de connexion ;
- upload/download diagnostics ;
- usage stockage ;
- erreurs S3 ;
- santé storage ;
- assets orphelins ;
- politique de suppression.

## Jobs / exports
Prévoir :
- exports PDF ;
- exports HTML ;
- exports PNG/JPEG ;
- exports PPTX ;
- génération de previews ;
- traitements images/assets ;
- traitements IA longs ;
- retries ;
- statuts ;
- erreurs ;
- historique.

Le suivi transverse des jobs doit s’articuler avec `features/exports`.

## Logs, audit et monitoring
Prévoir :
- logs d’audit métier ;
- logs de sécurité/auth ;
- logs techniques applicatifs ;
- logs IA ;
- logs paiement ;
- logs email ;
- logs assets ;
- erreurs Sentry ;
- logs structurés Pino ;
- request id / correlation id.

## Notifications
Distinguer :
- toasts via Sonner ;
- notifications persistantes via `features/notifications`.

Les événements admin importants doivent pouvoir créer des notifications persistantes :
- export terminé ;
- job échoué ;
- paiement refusé ;
- provider IA indisponible ;
- webhook échoué ;
- email non délivré ;
- alerte santé système.

## Paiements & règlements
Prévoir :
- passerelles ;
- méthodes de paiement ;
- abonnements/plans ;
- facturation ;
- règles de recouvrement ;
- webhooks paiements ;
- suivi des transactions ;
- remboursements ;
- litiges ;
- exports comptables si prévus.

## Interdictions locales
- Ne pas traiter l’admin comme le cœur produit.
- Ne pas créer un second système de logs concurrent à Pino/Sentry.
- Ne pas créer un second système de notifications persistantes hors `features/notifications`.
- Ne pas créer une configuration IA parallèle hors du module IA.
- Ne pas dupliquer la gestion storage hors `lib/storage` + admin storage.

## Vérifications locales
Après chaque lot admin, vérifier :
- cohérence avec stack ;
- tables lisibles et performantes ;
- filtres pertinents ;
- logs/audits présents si action sensible ;
- erreurs captables par Sentry ;
- logs structurés si opération serveur ;
- non-duplication avec settings/ai/notifications/exports.
