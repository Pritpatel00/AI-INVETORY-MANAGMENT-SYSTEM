# Inventory feature

This folder owns the warehouse, manager and administrator inventory experience.

## Structure

- `InventoryApp.tsx` — application shell: authentication gate, sticky header with
  breadcrumbs, page header, offline/sync status, account menu and workspace routing.
- `administrator/`, `manager/`, `warehouse-executive/` — one workspace each.
- `authentication/` — login, workspace selector, forced password change and the
  one-time local administrator password setup.
- `shared/` — shell components, `helpers.ts` (labels, page descriptions) and
  `ui.tsx` (the shared UI primitives).
- `api/` — typed backend requests. `offline/` — the IndexedDB offline queue.
- `hooks/` — browser capabilities (network status, offline sync).

## UI system

All visual language lives in `app/globals.css` — no additional UI framework.

**Design tokens** (`:root`) define the palette, radii, elevation, focus ring and
motion. Precise values, not decoration:

| Token group | Purpose |
| --- | --- |
| `--ink`, `--ink-muted`, `--ink-subtle` | the only three text levels |
| `--surface`, `--surface-muted`, `--surface-sunken` | card, muted and sunken backgrounds |
| `--line`, `--line-strong` | hairline borders |
| `--brand-blue*` | the single accent (primary actions, active navigation) |
| `--success` / `--warning` / `--danger` / `--info` / `--violet` | semantic status |
| `--radius-*`, `--shadow-*`, `--ring` | compact radii and quiet elevation |

**Primitives** are reusable `ui-*` classes styled in `globals.css` and wrapped by
`shared/ui.tsx`: `Button`, `Card`/`CardHeader`/`CardBody`, `PageHeader`,
`Breadcrumbs`, `Badge`, `StatusBadge`, `StatusDot`, `Alert`, `Field`, `TextInput`,
`TextArea`, `Select`, `Skeleton`/`SkeletonRows`, `Drawer`, `Modal`,
`ConfirmDialog`, `Tabs` and `Toast`.

Status is never conveyed by colour alone: `StatusBadge` pairs a tone with a glyph
and a text label, and every control keeps the global `:focus-visible` ring.

**Palette normalisation.** The dashboards were authored before the token layer,
so a dedicated section in `globals.css` folds their hard-coded hex values
(neutral borders, tints, text levels, dark panels, oversized radii) into the
tokens. Semantic tones are re-asserted afterwards so warnings, errors and
success states keep their meaning.

### Two rules to remember

1. `app/globals.css` is **unlayered**, so its rules beat Tailwind utilities in the
   cascade. Do not try to override a `ui-*` class with a Tailwind utility — add a
   variant class (e.g. `header-status-chip-compact`) instead.
2. Do not rely on Tailwind for accessibility-only display toggles
   (`hidden sm:inline-flex`) on elements that carry a `ui-*` class; use a
   media-query class in `globals.css`.

## Verification

```bash
npm --prefix frontend run typecheck
npm --prefix frontend run build
npm --prefix frontend run test:auth
```

The Playwright specs in `tests/e2e/` cover the real API, database, speech and AI
stack; they must be run against the full local stack described in
`tests/e2e/README.md`.
