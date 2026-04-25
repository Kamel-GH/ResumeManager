# STACK_IMPOSEE.md — Stack officielle du projet

## Statut
Ce fichier est la source de vérité technique pour la stack du projet.  
Il conserve un nom générique afin que `AGENTS.md` n’ait pas besoin d’être modifié à chaque évolution de la stack.

## Règle générale
Le projet doit respecter strictement la stack ci-dessous.  
Aucune bibliothèque alternative ne doit être introduite sans justification explicite et validation préalable.

## Socle obligatoire
- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

## Authentification obligatoire
- Better Auth

## Cœur produit obligatoire : éditeur canvas / template / layout
Le cœur du produit repose sur :
- Konva
- react-konva
- react-resizable-panels
- Zustand

Tout ce qui concerne canvas, template, layout, pages, objets, sélection, transformations, inspector et interactions d’édition doit être construit autour de Konva + react-konva, avec un état piloté par Zustand.

## Texte riche obligatoire
- Tiptap

### Extensions Tiptap autorisées et prévues
- StarterKit
- Underline
- TextAlign
- Link
- Image
- Table
- TableRow
- TableHeader
- TableCell
- Highlight
- Superscript
- Subscript
- Typography
- Placeholder
- CharacterCount
- TaskList
- TaskItem
- Mention
- TextStyle
- Color

Ne pas introduire d’autre éditeur rich text sans validation.

## Tables, listes et bibliothèques visuelles obligatoires
- TanStack Table
- TanStack Virtual
- React Virtuoso
- dnd-kit

Règles :
- TanStack Table + TanStack Virtual = tables et listes tabulaires.
- React Virtuoso = grandes listes visuelles, grids et bibliothèques d’assets.
- dnd-kit = drag & drop, tri, réorganisation.

## Upload, fichiers et stockage obligatoires
- Uppy
- AWS SDK v3 pour stockage S3-compatible :
  - `@aws-sdk/client-s3`
  - `@aws-sdk/s3-request-presigner`
  - `@aws-sdk/lib-storage`

Règles :
- Uppy = interface d’upload.
- AWS SDK v3 = couche stockage S3-compatible.
- Ne pas introduire de solution de stockage concurrente sans validation.

## PDF / génération documentaire obligatoire
- pdfme

Règles :
- pdfme = génération et composition PDF.
- Ne pas introduire de solution PDF concurrente comme moteur principal sans validation.

## Formulaires et validation obligatoires
- React Hook Form
- Zod

## Requêtes, cache et synchronisation obligatoires
- TanStack Query

## UI utilitaires retenus
- react-colorful
- Sonner
- lucide-react
- input-otp
- cmdk

Règles :
- react-colorful = color pickers.
- Sonner = toasts / feedback utilisateur / notifications éphémères.
- lucide-react = icônes de l’application.
- input-otp = OTP / 2FA / vérification par code uniquement.
- cmdk = palette de commandes / recherche d’actions.

## Graphiques / dashboards obligatoires
- visx

Règle :
- Ne pas introduire Recharts.
- Les graphiques et dashboards doivent être construits avec visx.

## Logs, erreurs et monitoring obligatoires
- Sentry
- Pino
- react-error-boundary

Règles :
- Sentry = erreurs, exceptions, monitoring.
- Pino = logs structurés applicatifs.
- react-error-boundary = isolation d’erreurs UI / fallback local des zones React.
- Ne pas ajouter une autre solution principale de logging/error tracking sans validation.

## Base de données obligatoire
- PostgreSQL
- Prisma

## Tests obligatoires
- Vitest
- Playwright

## Bibliothèques explicitement non retenues
Ne pas utiliser :
- Recharts
- TOAST UI Image Editor
- react-cropper
- Polotno
- Pintura

## Interdictions structurelles
- Ne pas multiplier les bibliothèques couvrant déjà un besoin traité par la stack retenue.
- Ne pas introduire un second state manager.
- Ne pas introduire un second éditeur rich text.
- Ne pas introduire une seconde librairie principale de charts.
- Ne pas introduire une seconde solution principale d’upload.
- Ne pas introduire une seconde solution principale de logging/error tracking.
- Ne pas introduire un second moteur PDF principal sans validation.

## Version courte de référence
```txt
Next.js
React
TypeScript
Tailwind CSS
shadcn/ui
Better Auth
Konva
react-konva
react-resizable-panels
Zustand
Tiptap
TanStack Table
TanStack Virtual
React Virtuoso
dnd-kit
Uppy
@aws-sdk/client-s3
@aws-sdk/s3-request-presigner
@aws-sdk/lib-storage
pdfme
React Hook Form
Zod
TanStack Query
react-colorful
Sonner
lucide-react
input-otp
cmdk
visx
Sentry
Pino
react-error-boundary
PostgreSQL
Prisma
Vitest
Playwright
```

## Priorité de lecture
Si une suggestion, un exemple, une dépendance transitive, une habitude de développeur ou une proposition de l’IA contredit ce fichier, `STACK_IMPOSEE.md` prévaut.
