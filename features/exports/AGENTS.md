# AGENTS.md — Exports & Jobs

## Purpose

This file governs `features/exports`.

The exports module is a first-class product module. It must not be treated as a simple utility. It is responsible for exporting documents created in the editor while preserving the WYSIWYG result defined by the canonical render pipeline.

## Reference files

Always respect:

- `AGENTS.md`
- `STACK_IMPOSEE.md`
- `TARGET_REPO_TREE_v4.md`
- `features/editor/AGENTS.md`
- `features/data-mapping/AGENTS.md`

The stack source of truth is `STACK_IMPOSEE.md`.

## Core principle

All exports must be based on the canonical rendering pipeline:

```txt
Template Schema
-> Binding Engine
-> Layout Engine
-> Canonical Render Tree
-> Renderers
-> Export Output
```

Do not export directly from temporary editor state.

Do not treat Konva as the source of truth.

Do not treat HTML as the only source of truth.

The canonical render tree is the WYSIWYG reference.

## Scope

The module must support or prepare for:

- HTML export
- PDF export
- PNG export
- JPEG export
- PPTX export
- thumbnails
- previews
- export jobs
- async processing
- retries
- status tracking
- export history
- export logs
- export errors
- export metadata
- download links
- S3-compatible storage persistence

## Required export formats

### HTML

HTML export must:

- use the canonical render tree
- preserve page geometry
- preserve text styles
- preserve images, shapes, backgrounds and tables
- avoid re-running layout logic in the DOM
- be suitable for preview, sharing or downstream rendering

### PDF

PDF export must:

- preserve the computed layout
- rely on the canonical render tree
- use `pdfme` where template-driven PDF generation is appropriate
- remain compatible with the WYSIWYG pipeline
- avoid layout drift caused by browser-only recomposition unless explicitly accepted

### PNG / JPEG

Image export must:

- rasterize pages consistently
- support scale / quality options
- support page-by-page export
- support thumbnail generation
- never include editor-only overlays such as selections, handles, rulers or guides

### PPTX

PPTX export must:

- map pages to slides
- map text nodes to text boxes
- map image nodes to image boxes
- map shapes to PPTX shapes where possible
- preserve the structure and geometry as much as the PPTX format allows
- clearly document any unavoidable fidelity limitations

## Jobs

Export jobs must be explicit and observable.

A job should track:

- id
- type
- format
- source template id
- source render id
- user id
- organization / workspace id
- status
- progress
- started at
- completed at
- failed at
- retry count
- output asset id / URL
- error message
- logs / metadata

Expected statuses:

- `queued`
- `running`
- `completed`
- `failed`
- `cancelled`
- `retrying`

## Storage

Exported files must be stored through the approved S3-compatible stack:

- `@aws-sdk/client-s3`
- `@aws-sdk/s3-request-presigner`
- `@aws-sdk/lib-storage`

Do not introduce a second storage abstraction without explicit validation.

Store only metadata in PostgreSQL. Store binary files in S3-compatible storage.

## Logging and errors

Use:

- **Pino** for structured application logs
- **Sentry** for exceptions and error tracking

Every failed export must be traceable with:

- request id
- job id
- render id
- user id
- template id
- format
- error cause
- retry status

## Notifications

Exports should integrate with `features/notifications`.

Typical notifications:

- export completed
- export failed
- export cancelled
- export retry failed
- thumbnail generation completed
- PDF generation completed
- PPTX export completed

Use **Sonner** only for immediate transient feedback. Persistent notifications belong to the notification center.

## UI components

The module may include:

- ExportDialog
- ExportOptionsPanel
- ExportFormatSelector
- ExportQualitySelector
- ExportProgressPanel
- ExportJobStatusBadge
- ExportHistoryTable
- ExportDownloadButton
- ExportErrorDetails
- ThumbnailPreview
- ExportLogsDrawer

Tables must use:

- TanStack Table
- TanStack Virtual when needed

Do not introduce Recharts. Use `visx` for charts if export analytics are required.

## Interaction rules

- Export options must be explicit.
- Never silently change page size, margins, scale or quality.
- Warn the user when a format has fidelity limitations.
- Provide progress for long-running exports.
- Allow retry for failed jobs when technically possible.
- Never include editor-only UI artifacts in exported output.

## WYSIWYG requirements

Before an export is considered valid:

- it must be generated from the canonical render tree
- it must use the same geometry as the editor preview
- it must respect final bindings and visibility rules
- it must not reflow content independently unless explicitly marked as a non-WYSIWYG export mode
- it must preserve fonts, colors, dimensions and stacking order as far as the target format allows

## Do not

- do not export from raw Konva nodes as the primary source of truth
- do not export from raw DOM as the primary source of truth
- do not duplicate rendering rules outside the layout/render pipeline
- do not store generated binaries in PostgreSQL
- do not introduce Polotno, Pintura, Recharts, TOAST UI Image Editor or react-cropper
- do not bypass `STACK_IMPOSEE.md`

## Implementation discipline

When working in this module:

1. identify which export format is affected
2. identify the source render tree
3. identify the renderer involved
4. identify job behavior
5. identify storage behavior
6. identify notification behavior
7. run verification before completion

## Definition of done

A change in `features/exports` is done only if:

- the export is connected to the canonical render tree
- output format behavior is clear
- errors are logged with Pino and captured by Sentry where relevant
- S3-compatible storage rules are respected
- persistent notifications are triggered when needed
- job status is observable
- build/typecheck/lint pass
- relevant tests or manual checks are described
