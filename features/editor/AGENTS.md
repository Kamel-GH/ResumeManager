# AGENTS.md — Feature Editor

## Rôle
Ce dossier contient le cœur absolu du produit : l’éditeur Canvas / Template.
Aucune décision locale ne doit affaiblir ce statut.

## Stack locale obligatoire
Respecter `STACK_IMPOSEE.md`, notamment :
- Konva
- react-konva
- react-resizable-panels
- Zustand
- Tiptap + extensions validées
- react-colorful
- lucide-react
- Sonner
- cmdk
- pdfme
- visx si visualisation intégrée à l’éditeur
- react-error-boundary pour isoler les zones complexes

## Règle centrale
Ne jamais produire une fausse page d’éditeur.
Construire un vrai socle d’éditeur exploitable, fidèle aux écrans et pensé pour le rendu/export WYSIWYG.

## Exigences obligatoires de l’éditeur
### Shell
- topbar éditeur ;
- sidebar/navigation principale ;
- zone canvas centrale ;
- inspecteur/propriétés à droite ;
- panneaux contextuels ;
- panneaux Données, Bibliothèques, Calques, Objets, Pages, Paramètres ;
- panneaux redimensionnables via react-resizable-panels.

### Canvas
- canvas interactif desktop-first ;
- règles ;
- guides ;
- marges ;
- repères ;
- snapping / magnétisme ;
- zoom ;
- pan ;
- multi-pages ;
- affichage des dimensions ;
- cadres / bounding boxes ;
- poignées de redimensionnement ;
- overlays de sélection ;
- alignements et distributions.

### Manipulation d’objets
- sélection simple ;
- sélection multiple ;
- déplacement ;
- redimensionnement ;
- rotation si prévue ;
- duplication ;
- verrouillage ;
- visibilité ;
- groupement / dégroupement ;
- ordre d’empilement ;
- copier/coller ;
- raccourcis clavier ;
- undo / redo robuste.

### Blocs et contenus
- texte simple ;
- rich text avancé via Tiptap ;
- images ;
- icônes ;
- formes ;
- graphiques ;
- tableaux ;
- listes ;
- assets divers ;
- presets de blocs ;
- composants de template réutilisables.

### Inspecteur / propriétés
- position ;
- dimensions ;
- padding ;
- marges ;
- alignement ;
- typographie ;
- couleurs ;
- bordures ;
- ombres ;
- opacité ;
- background ;
- propriétés d’image ;
- propriétés de texte ;
- propriétés de données ;
- propriétés IA ;
- états contextuels selon l’élément sélectionné.

## Pipeline rendu/export WYSIWYG obligatoire
Le pipeline local doit respecter :

```txt
Template Schema -> Binding Engine -> Layout Engine -> Canonical Render Tree -> Renderers: Konva / HTML / PDF / PNG-JPEG / PPTX
```

Règles :
- Konva est le renderer interactif d’édition, pas la source métier.
- Le Template Schema est la source métier persistée.
- Le Canonical Render Tree est la vérité WYSIWYG finale.
- Les renderers sont des projections du render tree.
- Les exports ne doivent pas recalculer leur propre logique de layout.

## Sous-modules attendus
### `schema/`
- `template-render-types.ts`
- `template-schema.ts`
- `render-tree.ts`
- `document-types.ts`

### `binding/`
- binding-engine
- variable resolver
- visibility resolver
- repeater resolver

### `layout-engine/`
- layout engine
- text measurement
- pagination
- constraints

### `renderers/`
- konva-renderer
- html-renderer
- pdf-renderer
- image-renderer
- pptx-renderer

### `export/`
- export orchestrator
- export options
- export jobs

## Export obligatoire
Prévoir les formats :
- HTML
- PDF via pdfme comme moteur principal
- PNG/JPEG
- PPTX

Les exports doivent être cohérents avec la composition canvas et le render tree.

## State management
- Utiliser Zustand pour l’état éditeur : sélection, viewport, zoom, panels, pages, layers, clipboard, undo/redo.
- Ne pas créer un second state manager.
- Séparer `document state`, `editor UI state` et `render state`.

## Interdictions locales
- Ne pas faire de Konva la source de vérité métier.
- Ne pas faire de HTML le pivot unique du rendu.
- Ne pas introduire Polotno, Pintura, TOAST UI Image Editor ou react-cropper.
- Ne pas introduire un autre éditeur rich text que Tiptap.
- Ne pas casser la conformité WYSIWYG pour aller plus vite.

## Vérifications locales
Après chaque lot editor, vérifier :
- fidélité aux écrans ;
- stabilité de la sélection ;
- cohérence du state ;
- non-régression du render tree ;
- cohérence export si le lot touche au rendu ;
- absence d’erreur runtime isolée via react-error-boundary quand pertinent.
