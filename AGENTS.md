# AGENTS.md — Root Instructions V4.1

This file is the global operating charter for Codex on this project.
It is intentionally directive. It does not replace the module-specific `AGENTS.md` files, `STACK_IMPOSEE.md`, or `TARGET_REPO_TREE_v4.md`; it coordinates them.

## Mandatory reference files

Before any significant implementation, Codex must read and apply:

- `AGENTS.md` — global rules and execution protocol
- `STACK_IMPOSEE.md` — official technical stack and forbidden alternatives
- `TARGET_REPO_TREE_v4.md` — target repository architecture
- `features/editor/AGENTS.md` — editor/canvas/template rules
- `features/data-mapping/AGENTS.md` — variables, bindings and mapping rules
- `features/ai/AGENTS.md` — AI, LLM, prompt and field-level AI rules
- `features/admin/AGENTS.md` — administration, settings, logs, monitoring and operations rules

If a task touches a module with a local `AGENTS.md`, the local file must be read and followed in addition to this root file.

## Product priority

The absolute core of the product is the **Canvas / Template Editor**.

All other modules exist to support, configure, enrich, secure, monitor or exploit the editor:

1. Canvas / Template Editor
2. Dynamic data, variables, bindings, presets and mapping
3. WYSIWYG rendering and export pipeline
4. Field-level AI and prompt-governed content generation
5. Assets, libraries, objects, pages, layers and reusable blocks
6. Candidate, user and template management
7. Admin, settings, auth, payments, logs, notifications and operations

Any architecture decision must serve this product hierarchy.

## Non-negotiable product rules

The generated screens and validated specifications are the source of truth.

Codex must not:

- reinterpret the design freely;
- simplify screens without explicit approval;
- remove visible features, controls, panels, modals, popovers, table columns or settings;
- change wording unless explicitly asked;
- replace a specified component with an approximate equivalent;
- introduce an alternative design direction;
- treat admin, candidates or dashboards as the core product instead of the editor;
- introduce libraries outside `STACK_IMPOSEE.md` without explicit approval;
- use beta, alpha, rc, canary or experimental dependencies/APIs unless explicitly validated.

If something is ambiguous, use the most conservative interpretation, preserve fidelity to the screens, report the ambiguity, and ask only if the issue blocks implementation.

## Official stack policy

`STACK_IMPOSEE.md` is the single source of truth for the technical stack.

Rules:

- Do not duplicate the stack inside other files except as a short reminder.
- Do not introduce competing libraries for a need already covered by the stack.
- If a dependency is missing, first check whether the official stack already covers the need.
- If a new dependency is genuinely required, propose it explicitly with rationale, alternatives considered, risks and impact.
- The stack filename must remain generic: `STACK_IMPOSEE.md`, so it can evolve without updating this file each time.

Important current decisions include:

- Auth: Better Auth
- Canvas/editor: Konva + react-konva
- Editor state: Zustand
- Rich text: Tiptap
- Tables: TanStack Table + TanStack Virtual
- Visual lists/assets: React Virtuoso
- Drag and drop: dnd-kit
- Upload: Uppy
- Storage: S3-compatible via AWS SDK v3
- PDF/document generation: pdfme
- Charts: visx
- Toasts: Sonner
- Icons: lucide-react
- Command palette: cmdk
- Error boundary: react-error-boundary
- Error tracking: Sentry
- Structured logging: Pino
- Database: PostgreSQL + Prisma
- Tests: Vitest + Playwright

Explicitly non-retained libraries must not be used unless the stack file changes:

- Recharts
- TOAST UI Image Editor
- react-cropper
- Polotno
- Pintura

## Target architecture policy

`TARGET_REPO_TREE_v4.md` is the target architecture reference, not an instruction to scaffold everything immediately.

Rules:

- Do not create the full tree blindly.
- Compare the current repo with the target tree before creating files.
- Create only folders and files required for the current lot.
- Prefer incremental convergence toward the target architecture.
- Do not create empty structural folders without immediate purpose.
- If a structural migration is needed, propose it as a dedicated structural lot.
- Do not mix large structural moves with feature implementation unless unavoidable.

The target architecture is feature-first:

- `app/` = Next.js routes, layouts, pages and API entrypoints
- `features/` = domain modules and product logic
- `components/` = shared UI, layout primitives and reusable presentation components
- `lib/` = cross-cutting clients, helpers, integrations and constants
- `hooks/` = shared hooks only
- `stores/` = app-level/global stores only
- `schemas/` = shared schemas only
- `types/` = global shared types only
- `prisma/` = database schema, migrations and seed
- `tests/` = unit, integration and e2e tests

Feature-specific logic must remain inside its feature folder.
Shared UI must remain in `components/`.
Do not duplicate the same responsibility across `components`, `features`, `lib`, `stores` and `schemas`.

## Required nested AGENTS paths

The module-specific instruction files must live at:

- `features/editor/AGENTS.md`
- `features/data-mapping/AGENTS.md`
- `features/ai/AGENTS.md`
- `features/admin/AGENTS.md`

Do not move them to `src/features`, `src/components`, `app/*`, or any other location unless the target architecture is explicitly changed.

## WYSIWYG rendering and export policy

The project must support strict WYSIWYG rendering and export from the template/canvas composition.

The canonical pipeline is:

```txt
Template Schema
-> Binding Engine
-> Layout Engine
-> Canonical Render Tree
-> Renderers: Konva / HTML / PDF / PNG-JPEG / PPTX
```

Rules:

- Konva is not the source of truth; it is the interactive editor renderer.
- HTML is not the unique pivot; it is one renderer among others.
- The Canonical Render Tree is the WYSIWYG reference.
- Bindings, visibility rules, repeaters, fallbacks and AI-generated content must be resolved before final rendering.
- Layout must be calculated centrally and deterministically.
- Renderers must not reimplement business logic or layout decisions.
- PDF, HTML, image and PPTX exports must be derived from the same calculated geometry whenever possible.

Required conceptual modules:

- Template Schema
- Binding Engine
- Layout Engine
- Canonical Render Tree
- Konva Renderer
- HTML Renderer
- PDF Renderer
- Image Renderer
- PPTX Renderer
- Export Orchestrator

The detailed editor rules live in `features/editor/AGENTS.md`.

## Data mapping policy

The data-mapping module is a core product module, not a secondary form feature.

It must support:

- variables;
- presets;
- bindings;
- typed field mappings;
- repeaters;
- fallback values;
- visibility rules;
- transformations and formatting;
- preview of injected data;
- validation of mappings;
- detection of unmapped required fields;
- output to the Binding Engine / Bound Document.

Do not implement data mapping as isolated UI-only dropdowns. It must feed the rendering/export pipeline.

The detailed mapping rules live in `features/data-mapping/AGENTS.md`.

## AI policy

The AI module is a governed product subsystem.

It must support:

- providers;
- models;
- prompt templates;
- prompt versions;
- AI by field;
- field context definition;
- expected output schema;
- preview/test execution;
- fallback and retry strategy;
- human validation where needed;
- logs, cost, duration and execution status;
- integration with mappings, bindings and rendered outputs.

Do not hard-code AI behavior directly inside UI components.
Do not couple the system irreversibly to one provider unless explicitly decided.
Use provider/model/prompt abstractions.

The detailed AI rules live in `features/ai/AGENTS.md`.

## Admin, logs, notifications and jobs policy

Admin is an exploitation and governance layer for the product.

It must cover:

- users, roles, permissions and sessions;
- Better Auth-related administration;
- database status and maintenance;
- S3-compatible storage status;
- email configuration;
- AI/LLM configuration and monitoring;
- API/webhooks;
- payments/billing if implemented;
- audit logs;
- Sentry error visibility;
- Pino structured logs;
- export jobs;
- asset processing jobs;
- AI execution jobs;
- notifications and alerts;
- system health.

Notifications must be treated as a cross-cutting feature:

- Sonner = ephemeral toast feedback
- `features/notifications` = persistent notification center

Exports/jobs must exist at two levels:

- `features/editor/export` = document/canvas export logic
- `features/exports` = global export/job tracking and operational UI

The detailed admin rules live in `features/admin/AGENTS.md`.

## Execution protocol

Before writing meaningful code, Codex must:

1. inspect the repo tree;
2. read `package.json` and key config files;
3. identify the detected stack;
4. read `STACK_IMPOSEE.md`;
5. read `TARGET_REPO_TREE_v4.md`;
6. read relevant nested `AGENTS.md` files;
7. identify existing modules and reusable components;
8. compare the current repo against the target architecture;
9. produce a screen/module to route/component matrix;
10. produce an exact file plan;
11. propose lots;
12. implement only the current approved or implied lot.

Do not start by coding blindly.
Do not create many files without a file plan.
Do not perform broad refactors without declaring a structural lot.

## Lot discipline

Work must be split into small, reviewable lots.

Each lot must state:

- objective;
- screens/modules concerned;
- components concerned;
- files to create;
- files to modify;
- risks;
- verifications;
- expected result.

Recommended lot sequence:

1. Audit and target architecture comparison
2. Global shell and design primitives
3. Editor shell
4. Canvas, selection and manipulation
5. Inspector, panels, layers, pages and libraries
6. Template Schema and Render Tree foundations
7. Binding Engine and mapping integration
8. Layout Engine foundation
9. Renderers and export orchestrator foundation
10. AI global config and field-level AI integration
11. Dashboard and admin screens
12. Auth, users, candidates, tags and notifications
13. Logs, jobs, exports and system health
14. Tests, review and stabilization

## Quality gate

A lot is not complete unless:

- the implementation respects the screens and specs;
- the code is typed;
- the build passes;
- lint passes where configured;
- tests are added or updated when relevant;
- no obvious runtime error remains;
- imports are clean;
- responsibilities are placed in the correct folders;
- no forbidden library was introduced;
- no visible feature was silently dropped;
- deviations are explicitly documented.

## Skill governance

Default policy: deny by default.
Use a skill only when it is clearly necessary for the current lot.
Do not mentally activate more than 2 or 3 skills for the same lot.

### Always-allowed baseline skills

- writing-plans
- verification-before-completion
- requesting-code-review

### Explicit-approval-only skills

- subagent-driven-development
- systematic-debugging
- frontend-design
- web-design-guidelines
- analytics-tracking

### Module-oriented skill guidance

Editor / canvas lots may use:

- canvas-design
- tiptap
- zustand-state-management
- shadcn
- vercel-react-best-practices
- tailwind-design-system
- design-system-patterns
- motion

Data/mapping lots may use:

- database-design
- database-schema-designer
- frontend-to-backend-requirements
- api-design-principles

AI lots may use:

- prompt-engineering-patterns
- api-design-principles
- database-design

Admin/logs/jobs lots may use:

- tanstack-table
- database-design
- api-design-principles
- analytics-tracking only if explicitly useful

Testing/review lots may use:

- playwright-local
- vitest
- qa-test-planner
- verification-before-completion
- requesting-code-review

At the start of each task, Codex must state:

1. which skills it will use;
2. why;
3. which installed skills it will not use;
4. which phase each selected skill applies to.

If no skill is clearly necessary, use no skill.

## Required response format

When reporting work, use this structure:

```md
# Audit
# Plan
# Files impacted
# Implementation
# Verifications
# Risks / ambiguities
# Next lot
```

For the first response on a repo, use:

```md
# Audit
- detected stack
- detected architecture
- detected conventions
- existing modules
- reusable components
- major gaps with screens/specs

# Cartography
- screens/modules to implement
- existing routes
- routes to create
- components to preserve
- components to create
- sensitive areas

# Target architecture
- folders
- modules
- shared components
- stores / hooks / services / schemas

# Matrix: screens/modules -> routes -> components

# Exact file plan
- files to create
- files to modify
- files not to touch

# Lot order

# Risks / ambiguities

# Start
- first lot to implement
```

## Final rule

If there is a conflict between speed, simplification and fidelity, choose fidelity.
If there is a conflict between improvisation and architecture, choose architecture.
If there is a conflict between a generated convenience and the validated stack, choose `STACK_IMPOSEE.md`.
