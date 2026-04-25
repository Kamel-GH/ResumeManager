# AGENTS.md — Feature Data Mapping

## Rôle
Le module data-mapping est central. Il nourrit l’éditeur, structure les templates, permet l’injection des données et supporte les répétiteurs, fallbacks, previews et validations.

## Position dans le pipeline WYSIWYG
Le module data-mapping alimente le pipeline :

```txt
Template Schema -> Binding Engine -> BoundDocument -> Layout Engine -> Canonical Render Tree
```

Il ne doit pas seulement alimenter l’UI : il doit produire des données résolues, validées et prêtes pour le layout engine.

## Exigence centrale
Implémenter un module robuste, avancé et propre pour :
- variables ;
- presets ;
- mapping ;
- sources de données ;
- bindings texte / image / table / liste ;
- champs simples ;
- champs structurés ;
- répétiteurs / listes répétées ;
- fallback values ;
- règles de visibilité ;
- aperçus de données ;
- transformations / formatages ;
- validation ;
- preview de rendu injecté.

## Exigence majeure sur le mapping
Le système de mapping doit permettre au minimum :
- liaison champ UI ↔ source de données ;
- liaison simple et liaison avancée ;
- mapping par type de champ ;
- gestion de champs texte / image / liste / table / select ;
- répétiteurs pour expériences, formations, langues, compétences, etc. ;
- fallback si donnée absente ;
- preview du résultat mappé ;
- validation du mapping ;
- détection des champs non mappés ;
- configuration par template ;
- configuration réutilisable par preset ;
- séparation claire entre structure du template et source injectée.

## Objets attendus
- `VariableDefinition`
- `BindingDefinition`
- `MappingDefinition`
- `DataSourceDefinition`
- `PresetDefinition`
- `RepeaterDefinition`
- `VisibilityRule`
- `FallbackRule`
- `BoundDocument`
- `MappingValidationResult`

## Règles de résolution
- Les variables doivent être typées.
- Les bindings doivent être validables.
- Les répétiteurs doivent produire des structures résolues.
- Les fallbacks doivent être appliqués avant layout.
- Les règles de visibilité doivent être résolues avant render tree.
- Les erreurs de mapping doivent être explicites et exploitables.

## IA et mapping
Le mapping doit pouvoir recevoir des valeurs issues du module IA, mais ne doit pas devenir dépendant d’un fournisseur IA.

Règles :
- l’IA peut enrichir un champ source ;
- l’IA peut générer une valeur cible ;
- le résultat IA doit être validé avant injection ;
- les sorties IA doivent pouvoir être rejetées, acceptées ou modifiées humainement.

## Composants attendus
- MappingPanel
- BindingField
- VariablesPanel
- PresetsPanel
- RepeaterEditor
- FallbackEditor
- VisibilityRuleEditor
- MappingPreview
- MappingValidationPanel

## Ordre conseillé
1. modèle des variables ;
2. modèle des presets ;
3. bindings de base ;
4. mappings par type de champ ;
5. répétiteurs ;
6. fallback values ;
7. règles de visibilité ;
8. preview des injections ;
9. validation des mappings ;
10. production d’un BoundDocument ;
11. intégration au layout/render pipeline.

## Interdictions locales
- Ne jamais réduire le mapping à un simple champ `source`.
- Ne jamais traiter les répétiteurs comme un détail.
- Ne jamais couper la preview.
- Ne jamais perdre la validation.
- Ne jamais rendre le système dépendant d’un seul template.
- Ne jamais mélanger structure template et données injectées sans séparation claire.

## Vérifications locales
Après chaque lot data-mapping, vérifier :
- cohérence des types/schemas ;
- preview fonctionnelle ;
- validation présente ;
- erreurs lisibles ;
- intégration propre avec l’éditeur ;
- production correcte du BoundDocument si concerné.
