# TARGET_REPO_TREE.md

## Arborescence cible recommandée

```text
repo/
├── AGENTS.md
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
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   ├── reset-password/page.tsx
│   │   │   └── two-factor/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── editor/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── loading.tsx
│   │   │   │   └── error.tsx
│   │   │   ├── templates/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [templateId]/page.tsx
│   │   │   │   └── new/page.tsx
│   │   │   ├── data/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── variables/page.tsx
│   │   │   │   ├── presets/page.tsx
│   │   │   │   └── mapping/page.tsx
│   │   │   ├── users/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [userId]/page.tsx
│   │   │   ├── candidates/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [candidateId]/page.tsx
│   │   │   │   └── [candidateId]/edit/page.tsx
│   │   │   ├── workflows/page.tsx
│   │   │   ├── tags/
│   │   │   │   ├── page.tsx
│   │   │   │   └── requests/page.tsx
│   │   │   ├── settings/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── general/page.tsx
│   │   │   │   ├── ai/page.tsx
│   │   │   │   ├── api/page.tsx
│   │   │   │   ├── mail/page.tsx
│   │   │   │   ├── database/page.tsx
│   │   │   │   ├── payments/page.tsx
│   │   │   │   └── billing/page.tsx
│   │   │   └── admin/
│   │   │       ├── page.tsx
│   │   │       ├── roles/page.tsx
│   │   │       ├── audits/page.tsx
│   │   │       └── system-health/page.tsx
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── templates/
│   │   │   ├── editor/
│   │   │   ├── data/
│   │   │   ├── mapping/
│   │   │   ├── ai/
│   │   │   ├── prompts/
│   │   │   ├── users/
│   │   │   ├── candidates/
│   │   │   ├── tags/
│   │   │   ├── admin/
│   │   │   ├── payments/
│   │   │   ├── billing/
│   │   │   ├── mail/
│   │   │   └── health/
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/
│   │   │   ├── app-shell/
│   │   │   ├── sidebar/
│   │   │   ├── topbar/
│   │   │   ├── section-card/
│   │   │   ├── stat-card/
│   │   │   ├── data-table/
│   │   │   ├── status-badge/
│   │   │   ├── tabs/
│   │   │   ├── stepper/
│   │   │   ├── form-field/
│   │   │   ├── modal/
│   │   │   ├── popover/
│   │   │   ├── drawer/
│   │   │   ├── progress-bar/
│   │   │   ├── activity-timeline/
│   │   │   └── chart-card/
│   │   ├── editor/
│   │   │   ├── AGENTS.md
│   │   │   ├── shell/
│   │   │   ├── canvas/
│   │   │   ├── toolbar/
│   │   │   ├── inspector/
│   │   │   ├── layers/
│   │   │   ├── pages/
│   │   │   ├── objects/
│   │   │   ├── assets/
│   │   │   ├── bindings/
│   │   │   ├── previews/
│   │   │   └── shared/
│   │   ├── data-mapping/
│   │   │   ├── AGENTS.md
│   │   │   ├── variables/
│   │   │   ├── presets/
│   │   │   ├── bindings/
│   │   │   ├── repeaters/
│   │   │   ├── validation/
│   │   │   └── preview/
│   │   ├── ai/
│   │   │   ├── AGENTS.md
│   │   │   ├── providers/
│   │   │   ├── models/
│   │   │   ├── prompts/
│   │   │   ├── field-linking/
│   │   │   ├── logs/
│   │   │   └── preview/
│   │   ├── admin/
│   │   │   ├── AGENTS.md
│   │   │   ├── settings/
│   │   │   ├── roles/
│   │   │   ├── database/
│   │   │   ├── mail/
│   │   │   ├── api/
│   │   │   ├── payments/
│   │   │   ├── billing/
│   │   │   ├── logs/
│   │   │   └── health/
│   │   ├── candidates/
│   │   ├── users/
│   │   ├── tags/
│   │   └── dashboard/
│   ├── features/
│   │   ├── editor/
│   │   ├── data-mapping/
│   │   ├── ai/
│   │   ├── candidates/
│   │   ├── users/
│   │   ├── tags/
│   │   ├── admin/
│   │   ├── payments/
│   │   └── auth/
│   ├── lib/
│   │   ├── auth/
│   │   ├── db/
│   │   ├── ai/
│   │   ├── payments/
│   │   ├── mail/
│   │   ├── utils/
│   │   ├── formatting/
│   │   ├── validation/
│   │   └── constants/
│   ├── hooks/
│   ├── services/
│   │   ├── templates/
│   │   ├── editor/
│   │   ├── data-mapping/
│   │   ├── ai/
│   │   ├── candidates/
│   │   ├── users/
│   │   ├── tags/
│   │   ├── admin/
│   │   ├── payments/
│   │   └── mail/
│   ├── schemas/
│   │   ├── editor/
│   │   ├── data-mapping/
│   │   ├── ai/
│   │   ├── candidates/
│   │   ├── users/
│   │   ├── tags/
│   │   ├── admin/
│   │   └── payments/
│   ├── types/
│   ├── stores/
│   │   ├── editor/
│   │   ├── data-mapping/
│   │   ├── ai/
│   │   ├── auth/
│   │   └── ui/
│   ├── mocks/
│   │   ├── templates/
│   │   ├── candidates/
│   │   ├── users/
│   │   ├── admin/
│   │   ├── payments/
│   │   └── ai/
│   └── tests/
│       ├── unit/
│       ├── integration/
│       └── e2e/
└── README.md
```

## Placement recommandé des fichiers AGENTS

### Obligatoires
- `/AGENTS.md`
- `/src/components/editor/AGENTS.md`
- `/src/components/data-mapping/AGENTS.md`
- `/src/components/ai/AGENTS.md`
- `/src/components/admin/AGENTS.md`

### Variante si vous préférez un découpage par features
Vous pouvez déplacer les AGENTS imbriqués vers :
- `/src/features/editor/AGENTS.md`
- `/src/features/data-mapping/AGENTS.md`
- `/src/features/ai/AGENTS.md`
- `/src/features/admin/AGENTS.md`

Mais il faut choisir un seul découpage principal et rester cohérent.

## Recommandation pratique
Si le repo n’existe pas encore ou s’il est peu structuré :
- gardez l’App Router sous `src/app`
- gardez les vues dans `src/app`
- gardez les composants réutilisables dans `src/components`
- gardez la logique métier dans `src/features`
- gardez les services dans `src/services`
- gardez les schémas dans `src/schemas`
- gardez la persistence dans `prisma`

## Priorité d’implémentation recommandée
1. shell global
2. shell éditeur
3. canvas + sélection + manipulation
4. inspecteur + panneaux + bibliothèques
5. variables + presets + bindings
6. mapping avancé
7. IA globale + IA par champ
8. dashboard
9. auth
10. fiche candidat
11. gestion utilisateurs / candidats / tags
12. administration / DB / mail / API / paiements / règlements
