# AGENTS.md — Feature AI

## Rôle
Le module IA est un vrai module produit et d’administration.
Il ne doit jamais être traité comme un gadget ou une simple page de settings.

## Exigence centrale
Implémenter un système d’intégration IA profondément paramétrable, connecté à l’éditeur, aux champs, aux mappings et aux modules d’administration.

## Position dans le produit
Le module IA peut intervenir :
- avant mapping pour enrichir une source ;
- pendant le mapping pour générer une valeur cible ;
- dans l’éditeur pour suggérer ou transformer un contenu ;
- dans l’admin pour configurer providers, modèles, prompts, budgets et limites.

## Paramétrages IA globaux
Le module doit gérer :
- fournisseurs LLM ;
- modèles par défaut ;
- clés / secrets / références de configuration ;
- quotas ;
- budgets ;
- limites d’usage ;
- règles de routage ;
- fallback provider ;
- monitoring ;
- journalisation ;
- statuts de santé.

## Gestion des prompts
Prévoir :
- bibliothèque de prompts ;
- prompts versionnés ;
- description fonctionnelle ;
- statut brouillon / actif / archivé ;
- scope du prompt ;
- test de prompt ;
- aperçu d’entrée / sortie ;
- gouvernance minimale.

## IA paramétrable par champ
Le système doit permettre de lier un champ à l’IA de manière fine, configurable et gouvernée.

Au minimum :
- lier un champ à un fournisseur LLM ;
- lier un champ à un modèle ;
- lier un champ à un prompt précis ;
- définir le déclencheur ;
- définir le contexte entrant ;
- définir les champs sources utilisés comme contexte ;
- définir le format de sortie attendu ;
- définir le champ cible ;
- injecter le résultat dans le champ cible après validation ;
- gérer fallback / retry / validation ;
- gérer verrouillage humain / validation humaine si nécessaire ;
- logs d’exécution par champ.

## Sorties structurées
Les sorties IA doivent être autant que possible structurées et validées.

Règles :
- définir un output schema attendu ;
- valider les sorties avec Zod quand applicable ;
- signaler les erreurs de parsing ou de conformité ;
- ne jamais injecter silencieusement un résultat invalide ;
- stocker le statut : proposé, accepté, rejeté, modifié.

## Logs et observabilité
Utiliser :
- Pino pour logs structurés applicatifs ;
- Sentry pour erreurs/exceptions ;
- audit trail pour actions IA sensibles.

Tracer au minimum :
- provider ;
- modèle ;
- prompt version ;
- champ source/cible ;
- utilisateur ;
- durée ;
- tokens/coût estimé si disponible ;
- succès / erreur ;
- fallback déclenché ou non ;
- statut humain.

## Cas d’usage IA à prévoir
- génération de contenu ;
- reformulation ;
- enrichissement automatique ;
- résumé ;
- matching ;
- extraction structurée ;
- suggestions intelligentes ;
- scoring ;
- classification / tagging.

## Abstraction provider/model/prompt
Ne pas coupler dur le module à un fournisseur unique. Prévoir une abstraction claire :
- provider ;
- model ;
- prompt ;
- run ;
- output ;
- logs.

## Ordre conseillé
1. structure des fournisseurs LLM ;
2. structure des modèles ;
3. bibliothèque de prompts ;
4. versioning des prompts ;
5. UI de configuration globale ;
6. UI de liaison IA par champ ;
7. logique de déclenchement / preview ;
8. validation des sorties ;
9. logs et traçabilité ;
10. fallback / validation humaine.

## Exigence opérationnelle impérative
Quand l’IA par champ est implémentée, toujours montrer clairement :
- où se configure le provider ;
- où se configure le modèle ;
- où se configure le prompt ;
- où se configure le contexte ;
- où se configure le résultat cible ;
- comment se fait la preview ;
- comment se fait le contrôle.

## Interdictions locales
- Ne pas injecter directement des résultats IA non validés dans le document.
- Ne pas cacher les coûts, erreurs, fallbacks ou versions de prompts.
- Ne pas mélanger prompts actifs et prompts brouillons.
- Ne pas rendre le module dépendant d’un seul fournisseur.

## Vérifications locales
Après chaque lot IA, vérifier :
- configuration provider/model/prompt ;
- preview ;
- validation sortie ;
- logs ;
- erreurs Sentry si pertinentes ;
- intégration mapping/editor sans couplage fragile.
