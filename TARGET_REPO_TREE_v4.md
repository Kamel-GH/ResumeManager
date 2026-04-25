# TARGET_REPO_TREE_v4.md — Architecture cible feature-first

## Positionnement
Cette V4 remplace les versions précédentes.  
Elle part du principe que le projet n’a pas encore de code structurant dans les répertoires et que l’on peut choisir la hiérarchie la plus logique dès maintenant.

Objectif : maximiser la clarté pour Codex, la maintenabilité et la séparation nette des responsabilités.

## Choix d’architecture retenu
La structure retenue est feature-first :
- `app/` = routes, layouts, pages et route handlers Next.js.
- `features/` = cœur métier par domaine.
- `components/` = shared UI uniquement.
- `lib/` = transversal technique.
- `stores/` = state global applicatif uniquement.
- `schemas/` = contrats et validations partagés.
- `types/` = types globaux.

Cette structure évite les ambiguïtés entre :
- `components/editor` et `features/editor` ;
- `components/ai` et `features/ai` ;
- shared UI et logique métier.

## Règles structurantes

### `app/`
`app/` contient uniquement :
- routes ;
- layouts ;
- pages ;
- entrypoints Next.js ;
- route handlers dans `app/api`.

Aucune logique métier complexe ne doit être centralisée ici.

### `features/`
`features/` contient les modules métier. Chaque feature regroupe sa logique complète :
- composants métier ;
- hooks métier ;
- stores métier ;
- schemas métier ;
- services métier ;
- utils métier ;
- types métier.

### `components/`
`components/` contient uniquement les composants partagés et transverses :
- primitives UI ;
- layout global ;
- composants communs ;
- formulaires génériques ;
- feedbacks génériques ;
- composants de navigation transverses.

On n’y met pas la logique métier de l’éditeur, du mapping, de l’IA, de l’admin, etc.

### `lib/`
`lib/` contient le transversal technique :
- DB ;
- auth ;
- clients IA ;
- mail ;
- payments ;
- S3-compatible storage ;
- logging ;
- monitoring ;
- helpers globaux ;
- formatters ;
- validation partagée ;
- constantes globales.

### `stores/`
`stores/` contient uniquement le state global applicatif. Le state propre à un domaine doit rester dans `features/<domain>/stores`.

## Distinctions importantes

### AI fonctionnelle vs AI configuration vs AI backend
- `app/(dashboard)/ai` = workspace IA fonctionnel.
- `app/(dashboard)/settings/ai` = configuration IA système / org / tenant.
- `app/api/ai` = backend/API/exécution IA.

### Settings vs Admin
- `settings` = configuration fonctionnelle, métier, organisation, préférences.
- `admin` = supervision, exploitation, rôles avancés, logs, santé système, maintenance.

### Notifications
- Toasts / notifications éphémères = Sonner, composants partagés.
- Notifications persistantes = `features/notifications`, stockage en base, centre de notifications.

### Exports / jobs
- `features/editor/export` = export lié au document/canvas/template.
- `features/exports` = suivi transverse des exports/jobs, historique, statuts, erreurs, retries.

## Pipeline rendu/export WYSIWYG obligatoire
Le pipeline cible est :

```txt
Template Schema -> Binding Engine -> Layout Engine -> Canonical Render Tree -> Renderers: Konva / HTML / PDF / PNG-JPEG / PPTX
```

Règles :
- Konva n’est pas la source de vérité métier.
- HTML n’est pas le pivot unique du pipeline.
- Le Canonical Render Tree est la vérité WYSIWYG calculée.
- Tous les exports doivent partir de la même géométrie calculée.
- Les renderers ne doivent pas refaire la logique de binding ou de layout.

## Arborescence cible

```text
repo/
├── AGENTS.md
├── STACK_IMPOSEE.md
├── TARGET_REPO_TREE_v4.md
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── components.json
├── tailwind.config.ts
├── .eslintrc.*
├── .prettierrc.*
├── .env.example
├── public/
│   ├── icons/
│   ├── images/
│   ├── illustrations/
│   └── placeholders/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   └── two-factor/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── editor/page.tsx
│   │   ├── templates/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [templateId]/page.tsx
│   │   ├── data/
│   │   │   ├── page.tsx
│   │   │   ├── variables/page.tsx
│   │   │   ├── presets/page.tsx
│   │   │   └── mapping/page.tsx
│   │   ├── ai/
│   │   │   ├── page.tsx
│   │   │   ├── prompts/page.tsx
│   │   │   ├── field-linking/page.tsx
│   │   │   ├── providers/page.tsx
│   │   │   ├── models/page.tsx
│   │   │   ├── runs/page.tsx
│   │   │   └── logs/page.tsx
│   │   ├── candidates/
│   │   │   ├── page.tsx
│   │   │   ├── [candidateId]/page.tsx
│   │   │   └── [candidateId]/edit/page.tsx
│   │   ├── users/
│   │   │   ├── page.tsx
│   │   │   └── [userId]/page.tsx
│   │   ├── tags/
│   │   │   ├── page.tsx
│   │   │   └── requests/page.tsx
│   │   ├── notifications/
│   │   │   ├── page.tsx
│   │   │   └── preferences/page.tsx
│   │   ├── exports/
│   │   │   ├── page.tsx
│   │   │   ├── jobs/page.tsx
│   │   │   └── [exportId]/page.tsx
│   │   ├── settings/
│   │   │   ├── page.tsx
│   │   │   ├── general/page.tsx
│   │   │   ├── ai/page.tsx
│   │   │   ├── api/page.tsx
│   │   │   ├── mail/page.tsx
│   │   │   ├── database/page.tsx
│   │   │   ├── payments/page.tsx
│   │   │   ├── billing/page.tsx
│   │   │   └── notifications/page.tsx
│   │   └── admin/
│   │       ├── page.tsx
│   │       ├── roles/page.tsx
│   │       ├── audits/page.tsx
│   │       ├── logs/page.tsx
│   │       ├── jobs/page.tsx
│   │       ├── storage/page.tsx
│   │       └── system-health/page.tsx
│   └── api/
│       ├── auth/
│       ├── templates/
│       ├── editor/
│       ├── data/
│       ├── mapping/
│       ├── ai/
│       ├── prompts/
│       ├── users/
│       ├── candidates/
│       ├── tags/
│       ├── notifications/
│       ├── exports/
│       ├── jobs/
│       ├── admin/
│       ├── payments/
│       ├── billing/
│       ├── mail/
│       ├── storage/
│       └── health/
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── popover.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── badge.tsx
│   │   ├── sonner.tsx
│   │   └── ...
│   ├── layout/
│   │   ├── app-shell.tsx
│   │   ├── sidebar.tsx
│   │   ├── topbar.tsx
│   │   └── right-panel.tsx
│   ├── shared/
│   │   ├── section-card.tsx
│   │   ├── stat-card.tsx
│   │   ├── status-badge.tsx
│   │   ├── progress-bar.tsx
│   │   ├── chart-card.tsx
│   │   ├── activity-timeline.tsx
│   │   ├── kbd.tsx
│   │   └── ...
│   ├── feedback/
│   │   ├── error-boundary.tsx
│   │   ├── empty-state.tsx
│   │   ├── loading-state.tsx
│   │   └── toast-actions.tsx
│   ├── command/
│   │   ├── command-menu.tsx
│   │   └── command-provider.tsx
│   └── forms/
│       ├── form-field.tsx
│       ├── field-group.tsx
│       └── ...
├── features/
│   ├── editor/
│   │   ├── AGENTS.md
│   │   ├── components/
│   │   │   ├── canvas/
│   │   │   ├── inspector/
│   │   │   ├── toolbar/
│   │   │   ├── panels/
│   │   │   ├── layers/
│   │   │   ├── pages/
│   │   │   ├── assets/
│   │   │   ├── rich-text/
│   │   │   └── export/
│   │   ├── schema/
│   │   │   ├── template-render-types.ts
│   │   │   ├── template-schema.ts
│   │   │   ├── render-tree.ts
│   │   │   └── document-types.ts
│   │   ├── binding/
│   │   │   ├── binding-engine.ts
│   │   │   ├── variable-resolver.ts
│   │   │   ├── visibility-resolver.ts
│   │   │   └── repeater-resolver.ts
│   │   ├── layout-engine/
│   │   │   ├── layout-engine.ts
│   │   │   ├── text-measurement.ts
│   │   │   ├── pagination.ts
│   │   │   └── constraints.ts
│   │   ├── renderers/
│   │   │   ├── konva-renderer/
│   │   │   ├── html-renderer/
│   │   │   ├── pdf-renderer/
│   │   │   ├── image-renderer/
│   │   │   └── pptx-renderer/
│   │   ├── export/
│   │   │   ├── export-orchestrator.ts
│   │   │   ├── export-options.ts
│   │   │   └── export-jobs.ts
│   │   ├── hooks/
│   │   ├── stores/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── constants/
│   │   └── types.ts
│   ├── data-mapping/
│   │   ├── AGENTS.md
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── stores/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── resolvers/
│   │   ├── validators/
│   │   ├── utils/
│   │   ├── constants/
│   │   └── types.ts
│   ├── ai/
│   │   ├── AGENTS.md
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── stores/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── providers/
│   │   ├── prompts/
│   │   ├── runs/
│   │   ├── logs/
│   │   ├── utils/
│   │   ├── constants/
│   │   └── types.ts
│   ├── notifications/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── stores/
│   │   └── types.ts
│   ├── exports/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── jobs/
│   │   └── types.ts
│   ├── candidates/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── utils/
│   │   └── types.ts
│   ├── users/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── utils/
│   │   └── types.ts
│   ├── tags/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── utils/
│   │   └── types.ts
│   ├── admin/
│   │   ├── AGENTS.md
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── health/
│   │   ├── audits/
│   │   ├── logs/
│   │   ├── jobs/
│   │   ├── storage/
│   │   ├── utils/
│   │   └── types.ts
│   ├── payments/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── utils/
│   │   └── types.ts
│   └── auth/
│       ├── components/
│       ├── hooks/
│       ├── schemas/
│       ├── services/
│       ├── utils/
│       └── types.ts
├── lib/
│   ├── db/
│   ├── auth/
│   ├── ai/
│   ├── mail/
│   ├── payments/
│   ├── storage/
│   ├── logging/
│   ├── monitoring/
│   ├── utils/
│   ├── formatting/
│   ├── validation/
│   └── constants/
├── hooks/
│   ├── use-debounce.ts
│   ├── use-media-query.ts
│   └── ...
├── stores/
│   ├── ui/
│   └── app/
├── schemas/
│   ├── common/
│   └── shared/
├── types/
│   ├── global.ts
│   ├── api.ts
│   └── ...
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── README.md
```

## AGENTS imbriqués cohérents avec cette V4
- `features/editor/AGENTS.md`
- `features/data-mapping/AGENTS.md`
- `features/ai/AGENTS.md`
- `features/admin/AGENTS.md`

## Règle d’usage
Cette arborescence est une cible de structure, pas un scaffold à générer aveuglément.  
Créer uniquement les dossiers et fichiers nécessaires au lot en cours, sauf demande explicite de scaffolding.
