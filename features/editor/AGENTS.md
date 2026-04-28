# AGENTS.md — Editor / Konva Workspace Rules

## Active Scope

This file applies to the editor module under `features/editor/`.

Its priority is the **central template/canvas editor** powered by Konva.

When working in this module, prioritize:

- `components/canvas/`
- `renderers/konva-renderer/`
- `schema/`
- `binding/`
- `layout-engine/`
- `stores/`
- `hooks/`
- `components/rich-text/`
- `components/inspector/`
- `components/pages/`
- `components/layers/`
- `components/objects/`
- `components/export/`

Do not use this file as a reason to refactor the left sidebar, CSS centralization, global navigation, or unrelated UI unless explicitly requested.

---

## Project Goal

This project is a professional dynamic template editor for creating reusable, data-driven documents such as:

- CVs;
- flyers;
- brochures;
- multi-page documents;
- templates connected to structured data.

This is not a simple drawing app and not a generic Canva clone.

The editor must combine:

- a central Konva-powered workspace;
- a multi-page document model;
- user-facing layers;
- editable objects;
- Rich Text editing;
- variables;
- repeatable dynamic data presets;
- drag and drop from libraries;
- synchronized inspectors;
- preview and export modes.

The implementation priority is the central workspace / canvas editor, not the left sidebar CSS migration.

---

## Global Working Rules

- Do not redesign the UI unless explicitly asked.
- Preserve existing visual rendering when refactoring.
- Do not rename core files unless explicitly asked.
- Do not create suffixed files such as `Component.v2.jsx`, `Component.pass3.jsx`, or `Component-final.jsx`.
- Audit before modifying.
- Make one safe incremental change per pass.
- Do not rewrite unrelated components.
- Do not remove Tailwind or existing styling systems unless explicitly requested and after a dedicated migration plan.
- If both standalone HTML and JSX sources exist, keep them synchronized only when the task explicitly concerns those sources.

---

## Scope Priority

When asked to work on the editor workspace, focus on:

- central workspace layout;
- viewport;
- Konva Stage;
- technical Konva layers;
- pages;
- page formats;
- document objects;
- user-facing layers;
- object selection;
- Konva Transformer;
- drag and drop to canvas;
- guides and snapping;
- zoom and pan;
- Rich Text block behavior;
- inspector synchronization;
- preview/export preparation.

Do not focus on:

- left sidebar CSS centralization;
- left sidebar visual refactor;
- global navigation changes;
- replacing the existing left panel logic;
- rewriting unrelated UI;
- changing panel widths, topbar height, sidebar width, colors, spacing, hover states, focus states, or layout hierarchy unless the task explicitly requires it.

---

## Interface Structure

### Topbar

Height: approximately 50px.

The topbar has two visual zones:

- left zone: global application context;
- right zone: actions for the active module.

The right zone may contain:

- undo / redo;
- preview;
- export;
- zoom;
- design mode;
- data mode;
- save;
- share.

### Global Left Sidebar

Width: approximately 66px.

This sidebar contains only global application navigation.

It must never contain canvas tools.

It may contain:

- global navigation buttons;
- user avatar/photo at the bottom;
- logout icon at the bottom.

### Left Editor Panel

Default width: 340px.

Purpose:

- data;
- libraries;
- document structure.

It contains:

- Data;
- Libraries;
- Layers;
- Objects;
- Pages.

This panel may be collapsible. User display preferences should be persisted locally.

### Central Workspace

The central workspace is the main priority and is managed by Konva.

It contains:

- viewport;
- workspace background;
- Konva Stage;
- pages;
- editable objects;
- selection;
- Transformer;
- guides;
- drop zones;
- zoom and pan behavior.

### Right Inspector Panel

Default width: 280px.

Purpose:

- inspectors;
- object properties;
- Rich Text configuration;
- image settings;
- shape settings;
- page settings;
- layer settings;
- group settings;
- data binding settings.

The inspector must reflect the current selection and must not become a separate source of truth.

---

## Core Product Model

The editor works on a reusable template.

Before reaching the editor, the user selects:

- an existing template model; or
- a blank template model.

The editor opens on an initialized document/template.

The same template can later be rendered with different data records.

Examples:

- one CV template can generate a CV for candidate A;
- the same CV template can generate a CV for candidate B;
- a brochure template can generate variants from structured data.

---

## Critical Distinction: Technical Konva Layers vs User-Facing Layers

Never confuse technical Konva rendering layers with user-facing document layers.

### Technical Konva Layers

Technical Konva layers are internal rendering layers.

They are real `Konva.Layer` instances, each backed by a canvas.

Limit technical Konva layers to approximately 4 or 5.

Recommended technical layers:

```text
Stage
├── backgroundLayer
├── pageLayer
├── contentLayer
├── guideLayer
└── interactionLayer
```

### `backgroundLayer`

Purpose:

- workspace background;
- optional grid;
- static non-interactive guides.

Rules:

- usually `listening: false`;
- should redraw rarely.

### `pageLayer`

Purpose:

- page surfaces;
- page backgrounds;
- page shadows;
- page bounds;
- visual page margins.

Rules:

- usually non-interactive;
- should not contain editable document objects.

### `contentLayer`

Purpose:

- editable document content.

Contains:

- text objects;
- Rich Text objects;
- images;
- shapes;
- icons;
- emojis;
- charts;
- variables;
- dynamic presets;
- groups.

User-facing document layers must be represented as `Konva.Group` nodes inside this layer.

### `guideLayer`

Purpose:

- smart guides;
- snap lines;
- margin guides;
- active drop zones;
- temporary alignment helpers.

Rules:

- usually `listening: false`;
- should not capture pointer events.

### `interactionLayer`

Purpose:

- selection;
- hover outlines;
- Transformer;
- resize handles;
- rotation handles;
- multi-selection rectangle;
- drop previews.

Rules:

- interactive;
- always above editable content;
- should not be included in final export unless explicitly required.

---

## User-Facing Layers

User-facing layers are the layers shown in the editor's Layers panel.

The user may create many user-facing layers.

Do not implement one `Konva.Layer` per user-facing layer.

Use `Konva.Group` inside `contentLayer`.

Correct structure:

```text
contentLayer
└── PageGroup
    ├── UserLayerGroup
    │   ├── ObjectNode
    │   ├── ObjectNode
    │   └── ObjectNode
    ├── UserLayerGroup
    │   └── ObjectNode
    └── UserLayerGroup
        └── ObjectNode
```

Each user-facing layer should support:

- id;
- name;
- pageId;
- order;
- visible;
- locked;
- active state;
- objects.

The active user-facing layer is the default destination for newly inserted objects.

The active layer must not imply a new technical Konva layer.

---

## Document Model Expectations

The document model should support:

```text
Document
├── pages[]
├── assets[]
├── globalSettings
└── dataSchema
```

Each page should support:

- id;
- name;
- width;
- height;
- orientation;
- custom dimensions;
- background;
- layers[];
- order.

A page can be:

- portrait;
- landscape;
- square;
- custom size.

Each object should support:

- id;
- type;
- name;
- pageId;
- layerId;
- x;
- y;
- width;
- height;
- rotation;
- locked;
- visible;
- style;
- dataBinding when applicable.

Supported object types include:

- text;
- richText;
- image;
- shape;
- icon;
- emoji;
- chart;
- variable;
- dynamicPreset;
- group.

---

## Page Rendering Rules

Pages are rendered in the central workspace.

A page has real dimensions and a real ratio.

Do not assume all pages are A4 portrait.

A template may include pages with different dimensions and orientations.

Pages can be:

- portrait;
- landscape;
- square;
- custom size.

When rendering page previews:

- preserve the real ratio;
- never stretch;
- never distort;
- never force-crop;
- use contain logic;
- center the page preview in its preview zone.

In the central workspace, pages should be rendered according to their real dimensions, scaled only by the workspace zoom system.

---

## Selection and Transformer Rules

The editor must support:

- single selection;
- multi-selection;
- deselection;
- hover feedback;
- locked object behavior;
- hidden object behavior;
- object transformation;
- resize;
- rotate;
- move;
- group;
- ungroup;
- align;
- reorder;
- lock;
- hide.

Use Konva Transformer for transformable objects.

Rules:

- locked objects must not be transformable;
- hidden objects must not be selectable;
- selection state must be synchronized with the right inspector;
- selection state must be reflected in Objects and Layers panels when applicable;
- selection visuals must live in `interactionLayer`;
- guides and snap lines must live in `guideLayer`.

Avoid continuous React state updates during drag or transform when not necessary.

Prefer:

- refs for live interaction;
- state synchronization on `dragend`;
- state synchronization on `transformend`.

---

## Drag and Drop to Canvas

All relevant items from the left editor panel must be draggable to the central canvas.

Draggable items include:

- variables;
- dynamic presets;
- text blocks;
- images;
- shapes;
- icons;
- emojis;
- charts.

During drag:

- show a ghost preview;
- show active drop zone;
- identify target page when possible;
- identify active insertion layer when possible.

On drop:

1. convert client coordinates to stage coordinates;
2. convert stage coordinates to page-local coordinates;
3. create an object in the active user-facing layer;
4. select the created object;
5. update inspector state;
6. update Objects and Layers panels when applicable.

Do not insert objects into a locked or hidden layer.

If the active layer is locked or hidden, the implementation must choose a safe behavior:

- prevent the drop; or
- ask for/select another valid target layer.

---

## Data Model: Variables and Dynamic Presets

### Variables

Variables are unit fields.

Examples:

```text
[Prénom]
[Nom]
[Photo]
[Email]
[Téléphone]
[Adresse]
```

They map to structured data paths.

Examples:

```text
[Prénom] -> candidate.firstName
[Photo] -> candidate.photo
[Email] -> candidate.email
```

Variable types may include:

- TEXT;
- IMAGE;
- LIST;
- TABLE.

Variables can be inserted:

- directly on the canvas;
- inside a Rich Text block;
- inside a text block when supported.

### Dynamic Presets

Dynamic presets are repeatable data blocks.

Examples:

```text
{EXPERIENCES}
{FORMATIONS}
{LANGUES}
{COMPETENCES}
{INTERETS}
```

They are not graphic style presets.

They are not Rich Text style presets.

They represent repeatable data collections such as:

- candidate.experiences[];
- candidate.education[];
- candidate.languages[];
- candidate.skills[];
- candidate.interests[].

Dynamic presets must be able to generate repeated visual sections according to the available data.

---

## Text Blocks vs Dynamic Presets

Do not confuse Text Blocks and Data Presets.

### Text Blocks

Text Blocks are visual or textual blocks ready to insert.

Examples:

- CV header;
- experience block;
- education block;
- skills block;
- language block;
- contact block;
- quote;
- brochure hook;
- editorial block;
- callout.

They belong to the Library section.

They can be inserted into:

- the canvas;
- a Rich Text zone when applicable.

### Dynamic Presets

Dynamic Presets are data-driven repeatable blocks.

Examples:

- `{EXPERIENCES}`;
- `{FORMATIONS}`;
- `{LANGUES}`;
- `{COMPETENCES}`;
- `{INTERETS}`.

They belong to the Data section.

They are connected to structured data.

---

## Rich Text Rules

Rich Text is a central feature.

A Rich Text block inserted from the toolbar must include its own contextual inline toolbar/menu on the canvas.

The inline toolbar/menu must provide the same formatting tool families as the right Rich Text inspector.

The right inspector is not the exclusive editor.

The right inspector is the detailed synchronized editing surface for the selected Rich Text block.

Both interfaces must read and write the same `RichTextState`.

Do not duplicate formatting logic between the inline toolbar and the right inspector.

Use shared commands/handlers for formatting actions.

Expected formatting families:

- font family;
- font size;
- bold;
- italic;
- underline;
- text color;
- alignment;
- lists;
- line height;
- letter spacing;
- paragraph styles;
- text style presets;
- variable insertion;
- dynamic preset insertion where applicable.

Changes made in the inline Rich Text toolbar must immediately update:

- the selected Rich Text block on the canvas;
- the right Rich Text inspector state.

Changes made in the right inspector must immediately update:

- the selected Rich Text block on the canvas;
- the inline toolbar/menu state.

The left Data > Presets tab is reserved for repeatable dynamic data blocks, not visual text style presets.

---

## Inspector Synchronization

The right inspector must reflect the current selection.

When the user selects:

- a page: show page properties;
- a text object: show text properties;
- a Rich Text block: show Rich Text inspector;
- an image: show image properties;
- a shape: show shape properties;
- a group: show group properties;
- a variable: show data binding;
- a dynamic preset: show preset/data mapping properties;
- a layer: show layer properties when applicable.

The inspector must not create a separate source of truth.

It must read and write the shared document state.

---

## Preview and Export Modes

The editor should support at least:

- design mode;
- data mode;
- preview mode;
- export mode.

### Design Mode

Focus:

- layout;
- objects;
- styles;
- visual construction.

### Data Mode

Focus:

- variable mapping;
- dynamic presets;
- data bindings;
- sample data.

### Preview Mode

Focus:

- rendering the template with real or fake data;
- hiding editor-only overlays;
- showing generated repeated sections.

### Export Mode

Focus:

- export-ready rendering;
- excluding editor-only overlays;
- preserving page dimensions;
- preserving object styles;
- rendering dynamic data correctly.

Editor-only layers such as `guideLayer` and `interactionLayer` should not be included in final export unless explicitly required.

---

## Performance Rules

Avoid performance pitfalls.

Do:

- keep technical Konva layers limited;
- use `Konva.Group` for user-facing layers;
- use `listening: false` for non-interactive visuals;
- avoid unnecessary redraws;
- use `batchDraw()` when useful;
- use refs for real-time Konva interactions;
- avoid React state updates on every dragmove if not necessary;
- synchronize state on `dragend` / `transformend`;
- avoid recreating Transformer unnecessarily;
- keep guide rendering lightweight;
- avoid expensive filters during live interaction.

Do not:

- create one `Konva.Layer` per user-facing layer;
- put everything into one single technical layer;
- mix UI overlays with document content;
- include interaction overlays in export;
- attach listeners to non-interactive static visuals;
- rewrite unrelated UI while implementing canvas behavior.

---

## Konva Documentation Rules

If a Konva MCP server is available, use it when implementing or debugging Konva-specific code.

If Konva MCP is not available in Codex, use local Konva documentation files.

Expected local files:

```text
docs/vendor/konva/llms.txt
docs/vendor/konva/llms-full.txt
docs/vendor/konva/ai-plugin.json
```

Rules:

1. Read `docs/vendor/konva/llms.txt` first for general Konva guidance.
2. Use `docs/vendor/konva/llms-full.txt` only when implementing or debugging a specific Konva API.
3. Do not load or summarize `llms-full.txt` unnecessarily.
4. Do not invent Konva APIs.
5. Prefer official Konva patterns for:
   - Stage;
   - Layer;
   - Group;
   - Transformer;
   - events;
   - drag and drop;
   - performance;
   - serialization;
   - export.

---

## CSS / Sidebar Rules

These rules are secondary and apply only when the task explicitly concerns sidebar or CSS migration.

- Do not work on CSS centralization unless explicitly asked.
- Preserve exact visual rendering when refactoring.
- Do not remove Tailwind until all Tailwind classes are removed through a dedicated pass.
- Existing CSS organization may include:
  - `sidebar-base.css`;
  - `sidebar-components.css`;
  - `sidebar-layout.css`;
  - `sidebar-panels.css`;
  - `sidebar-demo.css` when needed.
- Fixed visual styles should move to CSS only during a CSS-focused task.
- Dynamic values should use CSS variables when appropriate.
- Data-driven SVG/image styles may remain in JSX when necessary.
- If `LeftSidebar.html` embeds React code for a standalone demo and split JSX files mirror that embedded code, keep them synchronized only when the task explicitly concerns those files.

---

## Implementation Discipline

Before coding, Codex must:

1. identify existing workspace/canvas files;
2. identify existing state model or store;
3. identify existing Konva usage if any;
4. identify how the left panel currently sends drag/drop data;
5. identify how the right inspector currently receives selection state;
6. propose the target layer tree;
7. propose the document model to Konva rendering mapping;
8. propose one safe implementation step.

Do not implement broad rewrites without first explaining the target architecture.

Implement one safe step at a time.

---

## Files and Naming

Do not rename existing project files unless explicitly requested.

Do not create suffixed versions such as:

```text
Component.v2.jsx
Component.pass3.jsx
Component-final.jsx
```

When modifying files, keep their original names.

If a temporary audit or report is needed, place it in a clearly named documentation or audit file.

If a full pass must be generated, use a complete pass folder with original filenames preserved.

---

## Visual and Behavioral Preservation

Do not redesign existing UI unless explicitly requested.

Do not change:

- panel widths;
- topbar height;
- sidebar width;
- existing visual hierarchy;
- colors;
- spacing;
- hover states;
- focus states;
- layout structure;

unless the current task explicitly requires it.

When implementing the central Konva workspace, integrate it into the existing application structure instead of replacing unrelated UI.

---

## Expected Output Quality

The central editor must feel:

- modern;
- fluid;
- professional;
- precise;
- dense but readable;
- suitable for a production-grade design/document editor.

Avoid simplistic demos.

Avoid placeholder-only implementations when the requested task is architectural or production-oriented.

Prefer robust foundations that can scale to:

- many pages;
- many user-facing layers;
- many objects;
- dynamic data rendering;
- Rich Text editing;
- preview;
- export.
