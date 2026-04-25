# AGENTS.md — Notifications

## Purpose

This file governs `features/notifications`.

The notifications module is responsible for user-facing and admin-facing notifications across the application.

It covers:

- transient toasts
- persistent in-app notifications
- notification center
- unread counters
- links to related objects
- admin/system alerts
- job/export notifications
- AI run notifications
- payment notifications
- tag validation notifications
- upload and asset notifications

## Reference files

Always respect:

- `AGENTS.md`
- `STACK_IMPOSEE.md`
- `TARGET_REPO_TREE_v4.md`
- `features/admin/AGENTS.md`
- `features/exports/AGENTS.md`
- `features/ai/AGENTS.md`

The stack source of truth is `STACK_IMPOSEE.md`.

## Core distinction

There are two notification layers:

### 1. Toasts

Use **Sonner** for transient feedback only.

Examples:

- saved
- copied
- upload started
- export queued
- tag added
- error occurred

Toasts must be short-lived and must not be the only record for important events.

### 2. Persistent notifications

Use a custom notification center backed by PostgreSQL.

Examples:

- export completed
- export failed
- AI generation failed
- payment failed
- tag request requires validation
- user invitation accepted
- system health warning
- security event
- background job failed

Important events must be persistent.

## Scope

The module must support or prepare for:

- notification center
- unread badge in topbar
- notification drawer or page
- read / unread state
- archive / dismiss
- notification categories
- severity levels
- deep links to related objects
- role-targeted notifications
- user-targeted notifications
- organization / workspace notifications
- system notifications
- export/job notifications
- AI notifications
- admin alerts

## Notification model

A persistent notification should track:

- id
- organization / workspace id
- user id or target role
- type
- category
- severity
- title
- message
- status
- read at
- archived at
- action URL / deep link
- source module
- source entity type
- source entity id
- metadata
- created at
- expires at if relevant

Expected severity values:

- `info`
- `success`
- `warning`
- `error`
- `critical`

Expected statuses:

- `unread`
- `read`
- `archived`

## Categories

Recommended categories:

- `system`
- `editor`
- `export`
- `ai`
- `payment`
- `security`
- `admin`
- `asset`
- `tag`
- `candidate`
- `user`
- `workflow`

## Required integrations

### Editor

Notify for:

- autosave issues
- export queued/completed/failed
- template publish success/failure
- asset missing
- render warnings if user-facing

### Exports

Notify for:

- export completed
- export failed
- export retry failed
- generated download available
- PPTX/PDF/image generation status

### AI

Notify for:

- AI generation completed when async
- AI generation failed
- provider fallback triggered if user-facing
- prompt validation issue
- quota warning if relevant

### Admin

Notify for:

- system health warning
- database backup issue
- mail delivery incident
- payment provider incident
- S3/storage incident
- security warning

### Tags

Notify for:

- tag request submitted
- tag approved
- tag rejected
- tag merge suggested
- admin validation required

### Payments

Notify for:

- payment failed
- refund completed
- invoice overdue
- subscription risk
- webhook issue

## UI components

The module may include:

- NotificationBell
- NotificationBadge
- NotificationCenter
- NotificationDrawer
- NotificationList
- NotificationItem
- NotificationSeverityBadge
- NotificationPreferencesPanel
- NotificationEmptyState
- NotificationFilters
- NotificationActionButton
- NotificationSettingsCard

Use:

- Sonner for toasts
- lucide-react for icons
- TanStack Table only if a dense notification admin table is needed
- React Virtuoso if long notification lists require virtualization

## User preferences

The notification system should prepare for preferences such as:

- in-app notifications enabled/disabled by category
- email notifications enabled/disabled by category
- admin alerts enabled/disabled
- job notifications enabled/disabled
- AI notifications enabled/disabled
- payment notifications enabled/disabled
- quiet hours if needed later

Do not implement excessive preferences before there is a product need, but design the model so it can evolve.

## Logging and observability

Notification creation failures must be logged with **Pino**.

Unexpected runtime errors must be captured by **Sentry**.

Important notification events should include:

- request id
- user id
- organization id
- source module
- source entity id
- category
- severity

## Toast rules

Use toasts for immediate feedback only.

Good toast examples:

- `Template enregistré`
- `Export lancé`
- `Image importée`
- `Tag ajouté`
- `Erreur lors de l’upload`

Bad toast usage:

- do not use a toast as the only record for an export failure
- do not use a toast as the only record for payment failure
- do not use a toast as the only record for security issues
- do not use a toast as the only record for admin-critical alerts

## Persistent notification rules

Create persistent notifications for events that:

- may require later action
- concern an async job
- concern a failure
- concern security
- concern billing
- concern admin validation
- provide a download result
- should be visible after page reload

## Deep linking

Every actionable notification should link to the relevant screen when possible:

- export job
- template
- candidate
- user
- payment
- tag request
- AI run
- admin health issue
- asset

## Do not

- do not create a second toast library
- do not replace Sonner without validation
- do not store critical alerts only in local state
- do not create notifications without category/severity
- do not create untraceable notifications
- do not mix notification logic directly inside unrelated components when a service layer is appropriate

## Implementation discipline

When adding a new notification:

1. decide if it is toast, persistent, or both
2. define category and severity
3. define target audience
4. define source module/entity
5. define deep link
6. define whether it should be read/unread
7. ensure logging and error handling are in place

## Definition of done

A change in `features/notifications` is done only if:

- toast vs persistent behavior is explicit
- notification category and severity are defined
- persistence rules are respected
- user-facing copy is clear
- deep link behavior is defined when relevant
- Pino/Sentry behavior is respected for failures
- build/typecheck/lint pass
