# AGENTS.md — Root Instructions V5.0

This file is the global operating charter for Codex on this project.

It defines:

- architecture rules;
- execution rules;
- product priorities;
- rendering principles;
- stack governance;
- performance constraints;
- React quality expectations;
- module coordination.

It does not replace:

- module-specific `AGENTS.md` files;
- `STACK_IMPOSEE.md`;
- `TARGET_REPO_TREE_v4.md`.

It coordinates them.

---

# Mandatory reference files

Before any significant implementation, Codex must read and apply:

- `AGENTS.md`
- `STACK_IMPOSEE.md`
- `TARGET_REPO_TREE_v4.md`
- `features/editor/AGENTS.md`
- `features/data-mapping/AGENTS.md`
- `features/ai/AGENTS.md`
- `features/admin/AGENTS.md`

If a task touches a module with a local `AGENTS.md`, the local file must also be followed.

---

# Product priority

The absolute core of the product is the:

# Canvas / Template Editor

All other modules exist to:

- support;
- configure;
- enrich;
- secure;
- monitor;
- exploit;
- orchestrate

the editor ecosystem.

Priority order:

1. Canvas / Template Editor
2. Dynamic data / variables / bindings / mapping
3. WYSIWYG rendering and export pipeline
4. Field-level AI generation
5. Assets / libraries / layers / reusable blocks
6. Candidates / users / templates
7. Admin / operations / logs / monitoring / auth / payments

All architecture decisions must serve this hierarchy.

---

# Non-negotiable product rules

Validated screens and specifications are the source of truth.

Codex must not:

- reinterpret the design freely;
- simplify validated screens;
- remove controls or features silently;
- introduce alternative UX directions;
- replace specified components arbitrarily;
- treat dashboards/admin as the primary product;
- introduce non-approved libraries;
- use beta/canary/rc dependencies without validation.

When ambiguity exists:

- preserve fidelity;
- use the most conservative interpretation;
- document ambiguity;
- ask only if blocking.

---

# Official stack policy

`STACK_IMPOSEE.md` is the single source of truth for the stack.

Rules:

- Do not duplicate the full stack elsewhere.
- Do not introduce competing libraries.
- Reuse the approved stack first.
- Propose new dependencies explicitly with:
  - rationale;
  - alternatives;
  - risks;
  - impact.

---

# Important approved stack decisions

- Next.js App Router
- React 19
- Better Auth
- Zustand
- Konva + react-konva
- Tiptap
- TanStack Table
- TanStack Virtual
- React Virtuoso
- dnd-kit
- Uppy
- AWS SDK v3
- pdfme
- visx
- Sonner
- lucide-react
- cmdk
- react-error-boundary
- Sentry
- Pino
- PostgreSQL
- Prisma
- Vitest
- Playwright

---

# Forbidden / non-retained libraries

Do not introduce:

- Recharts
- TOAST UI Image Editor
- react-cropper
- Polotno
- Pintura

unless the stack file changes explicitly.

---

# Target architecture policy

`TARGET_REPO_TREE_v4.md` is the target architecture reference.

Rules:

- Do not scaffold the entire tree blindly.
- Compare current vs target architecture before creating files.
- Converge incrementally.
- Avoid empty structural folders.
- Separate structural migrations from feature lots.

---

# Feature-first architecture

- `app/` = routes / layouts / entrypoints
- `features/` = domain logic
- `components/` = shared UI
- `lib/` = cross-cutting helpers
- `hooks/` = shared hooks only
- `stores/` = global stores only
- `schemas/` = shared schemas only
- `types/` = shared global types only
- `prisma/` = DB layer
- `tests/` = tests

Feature-specific logic must remain inside feature folders.

Avoid duplicated responsibilities across:

- features
- components
- stores
- schemas
- lib

---

# Required nested AGENTS paths

Mandatory locations:

- `features/editor/AGENTS.md`
- `features/data-mapping/AGENTS.md`
- `features/ai/AGENTS.md`
- `features/admin/AGENTS.md`

Do not relocate them unless architecture changes explicitly.

---

# React quality policy

The project is validated with:

- React Doctor
- ESLint
- TypeScript

Rules:

- Avoid duplicated derived state.
- Avoid cascading setState.
- Avoid unstable object references.
- Avoid unnecessary useEffect.
- Avoid unnecessary useMemo.
- Avoid inline component declarations.
- Avoid unnecessary rerenders.
- Avoid broad subscriptions.
- Avoid storing large render trees in React state.
- Prefer stable callbacks.
- Prefer selectors.
- Prefer localized rendering.
- Prefer derived state.
- Prefer immutable updates.
- Prefer render isolation boundaries.

Before completing significant React/editor work, run:

```bash
pnpm lint
pnpm doctor
```

Do not introduce new critical React Doctor issues without justification.

---

# Zustand policy

Rules:

- Keep stores minimal.
- Keep stores normalized.
- Avoid storing derived/computed state.
- Prefer selectors.
- Prefer shallow selectors where useful.
- Avoid broad subscriptions.
- Avoid global rerenders from store updates.
- Separate transient interaction state from persistent document state.
- Keep editor interactions localized.

---

# Konva / canvas performance policy

The editor canvas is performance sensitive.

Rules:

- Avoid rerendering the full stage.
- Avoid unstable Konva props.
- Prefer localized node updates.
- Minimize React reconciliation inside the canvas tree.
- Avoid unnecessary React/Konva synchronization.
- Keep viewport updates lightweight.
- Avoid storing large transient interaction objects in React state.
- Prefer isolated rendering zones.

---

# Tiptap / ProseMirror policy

Rules:

- Keep schema deterministic.
- Keep node ids stable.
- Avoid uncontrolled extension mutations.
- Keep node views isolated.
- Avoid coupling editor state directly to UI state.
- Prefer transactional updates.
- Avoid unnecessary serialization/deserialization cycles.
- Keep plugins modular and composable.

---

# Next.js App Router policy

Rules:

- Prefer Server Components by default.
- Use Client Components only when necessary.
- Keep server/client boundaries explicit.
- Avoid leaking server-only logic to client bundles.
- Minimize hydration cost.
- Avoid unnecessary client-side state.

---

# WYSIWYG rendering and export policy

The rendering/export pipeline must remain deterministic.

Canonical pipeline:

```txt
Template Schema
-> Binding Engine
-> Layout Engine
-> Canonical Render Tree
-> Renderers
```

Renderers include:

- Konva
- HTML
- PDF
- PNG/JPEG
- PPTX

Rules:

- Konva is not the source of truth.
- HTML is not the unique pivot.
- Canonical Render Tree is the rendering reference.
- Bindings and visibility must resolve before rendering.
- Layout decisions must be centralized.
- Renderers must not duplicate business logic.
- Exports must share calculated geometry whenever possible.

---

# Required conceptual modules

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

Detailed editor rules live in: `features/editor/AGENTS.md`

---

# Data mapping policy

The mapping system is a core product subsystem.

It must support:

- variables;
- presets;
- bindings;
- typed mappings;
- repeaters;
- fallbacks;
- visibility rules;
- transformations;
- formatting;
- validation;
- unmapped field detection;
- preview injection;
- Bound Document output.

Do not implement mapping as isolated UI dropdowns.

Mapping must feed:

- Binding Engine;
- rendering pipeline;
- export pipeline.

---

# AI policy

The AI system is a governed subsystem.

It must support:

- providers;
- models;
- prompts;
- prompt versions;
- field-level AI;
- schemas;
- validation;
- retries;
- previews;
- execution logs;
- costs;
- durations;
- statuses;
- integrations with mappings and renderers.

Rules:

- Do not hard-code provider logic inside UI.
- Do not couple permanently to one provider.
- Use provider/model abstractions.

Detailed rules: `features/ai/AGENTS.md`

---

# Admin / logs / jobs policy

Admin is an exploitation layer.

It must cover:

- auth administration;
- users;
- roles;
- sessions;
- DB status;
- storage status;
- AI configuration;
- webhooks;
- payments;
- logs;
- Sentry visibility;
- Pino logs;
- jobs;
- exports;
- notifications;
- health monitoring.

Notifications:

- Sonner = ephemeral feedback
- `features/notifications` = persistent center

Exports/jobs:

- `features/editor/export`
- `features/exports`

---

# Execution protocol

For significant work, Codex must:

1. inspect the repo;
2. inspect package/config files;
3. inspect current architecture;
4. read relevant AGENTS files;
5. identify reusable components;
6. compare against target architecture;
7. produce a file plan;
8. implement only the current lot.

Small isolated fixes do not require the full audit protocol.

Use proportional reasoning relative to task complexity.

---

# Lot discipline

Work should be split into small reviewable lots.

Each lot should define:

- objective;
- modules;
- files;
- risks;
- validations;
- expected result.

---

# Recommended lot order

1. Audit and architecture comparison
2. Global shell and primitives
3. Editor shell
4. Canvas manipulation
5. Inspector/panels/layers/pages
6. Schema + Render Tree
7. Mapping + Binding Engine
8. Layout Engine
9. Renderers + exports
10. AI integration
11. Admin/dashboard
12. Auth/users/candidates
13. Logs/jobs/monitoring
14. Stabilization/testing

---

# Quality gate

A lot is incomplete unless:

- implementation matches screens/specs;
- code is typed;
- build passes;
- lint passes;
- React Doctor passes;
- tests are added/updated when relevant;
- imports are clean;
- responsibilities are correctly placed;
- forbidden libraries were not introduced;
- visible features were not silently removed.

---

# Skill governance

Default policy: deny by default.

Use skills only when clearly useful.

Avoid activating too many skills simultaneously.

Recommended maximum: 2–3 skills per lot.

---

# Always-allowed baseline skills

- writing-plans
- verification-before-completion
- requesting-code-review

---

# Explicit-approval-only skills

- subagent-driven-development
- systematic-debugging
- frontend-design
- web-design-guidelines
- analytics-tracking

---

# Module-oriented skill guidance

Editor lots may use:

- canvas-design
- tiptap
- zustand-state-management
- shadcn
- vercel-react-best-practices
- tailwind-design-system
- design-system-patterns
- motion

Mapping lots may use:

- database-design
- database-schema-designer
- api-design-principles

AI lots may use:

- prompt-engineering-patterns
- api-design-principles

Testing/review lots may use:

- playwright-local
- vitest
- qa-test-planner
- verification-before-completion
- requesting-code-review

---

# Required response format

When reporting work:

```md
# Audit
# Plan
# Files impacted
# Implementation
# Verifications
# Risks / ambiguities
# Next lot
```

For the first repo response:

```md
# Audit
# Cartography
# Target architecture
# Matrix
# Exact file plan
# Lot order
# Risks / ambiguities
# Start
```

---

# Final rule

If there is a conflict between:

- speed and fidelity → choose fidelity;
- improvisation and architecture → choose architecture;
- convenience and stack governance → choose stack governance.

