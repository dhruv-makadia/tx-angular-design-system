# @tx-angular-design-system/core

An Angular 22 design system: accessible, signal-based, token-themed components built on
**Angular Aria** and the **Angular CDK**.

- Standalone components, `OnPush`, zoneless-compatible, signals throughout
- Every token is a CSS custom property — override one and it cascades everywhere, at runtime
- Light and dark themes, plus per-subtree theme scoping
- Self-hosted fonts (~108 KB), no CDN, works in air-gapped builds
- WCAG 2.2 AA verified, including non-text contrast for control borders
- Optional Tailwind v4 bridge — no Angular Material dependency

## Install

```bash
ng add @tx-angular-design-system/core
```

That installs peer dependencies at versions matching your Angular, sets up Tailwind if you want
it, wires the theme into your global stylesheet in the right cascade order, and drops an overrides
stub at `src/styles/_tx-overrides.css`. Running it twice changes nothing.

To do it by hand instead:

```bash
npm install @tx-angular-design-system/core @angular/aria @angular/cdk
```

Then import the theme once, in your global stylesheet:

```css
@import '@tx-angular-design-system/core/styles/theme.css';
```

Using Tailwind v4 as well? Add the bridge so utilities resolve to the same tokens:

```css
@import 'tailwindcss';
@import '@tx-angular-design-system/core/styles/theme.css';
@import '@tx-angular-design-system/core/styles/tailwind.css';
```

Set application-wide defaults at bootstrap:

```ts
import { provideTxDesignSystem } from '@tx-angular-design-system/core';

bootstrapApplication(App, {
  providers: [provideTxDesignSystem({ density: 'compact', pageSize: 25 })],
});
```

## Components

| Component | Notes |
| --- | --- |
| `tx-button` | Filled, tonal, outlined, text and danger variants; three sizes; loading state. |
| `tx-icon` | Inline SVG from a registry. `provideTxIcons()` adds your own. |
| `tx-card` | Header, media, content and action slots. Elevated, outlined or filled. |
| `tx-input` | Text, number, email, password, search. Prefix/suffix slots, clear, counter. |
| `tx-textarea` | Auto-sizing via the CDK. Same API shape as `tx-input`. |
| `tx-checkbox` | Native checkbox with an indeterminate state. |
| `tx-toggle` | A switch (`role="switch"`) for settings that apply immediately. |
| `tx-radio-group` | Native radios in a fieldset — arrow-key navigation from the platform. |
| `tx-select` | Single choice. Filterable, clearable, grouped options, loading state. |
| `tx-multi-select` | Multiple choice with chips, overflow summary, select-all. |
| `tx-table` | Declarative columns, sorting, pagination, sticky header, density. |
| `tx-paginator` | Page size, typed page numbers and arrows; usable standalone. |
| `tx-sidebar` | Router-agnostic navigation with groups, badges and a collapsible rail. |
| `tx-header` | App bar: brand, a free middle region, trailing actions. |
| `tx-app-shell` | Sidebar column beside scrolling content, with a drawer below 48rem. |
| `tx-accordion` | Collapsible sections, single or multi-expand, soft-disabled panels. |
| `tx-tree` | Hierarchy with lazy children and filtering that keeps a match's path. |
| `tx-reorder-list` | Drag *and* keyboard reordering, with announcements. |
| `TxDialogService` | Opens dialogs; `confirm()` returns a plain boolean. |
| `TxToastService` | Transient messages with a sensible `aria-live` policy. |

### Select

```html
<tx-select
  label="Supplier"
  [options]="suppliers()"
  [(value)]="supplier"
  clearable />
```

### Multi-select

```html
<tx-multi-select
  label="Regions"
  [options]="regions()"
  [(value)]="activeRegions"
  [maxVisibleChips]="2" />
```

### Table

Columns are data, so a table is described rather than assembled:

```ts
columns: TxTableColumn<Item>[] = [
  { key: 'ref',   header: 'Reference', variant: 'data',    sortable: true },
  { key: 'name',  header: 'Name',                          sortable: true },
  { key: 'price', header: 'Price',     variant: 'numeric', sortable: true, align: 'end' },
];
```

```html
<tx-table [data]="rows()" [columns]="columns" paginated />
```

`variant: 'data' | 'numeric'` switches a column to the monospaced face with tabular figures,
which is what keeps identifiers and measurements aligned down a column.

By default the table sorts and slices the array it is given. Set `serverSide` and it stops
touching the data — `sortChange` and `pageChange` still fire, and `total` supplies the row count.

## Theming

Override any token **after** the import. Every semantic token, component style and Tailwind
utility follows:

```css
@import '@tx-angular-design-system/core/styles/theme.css';

:root {
  --tx-color-accent: #0d47a1;
  --tx-color-on-accent: #ffffff;
  --tx-font-sans: 'Inter', system-ui, sans-serif;
}

/* The accent is theme-scoped: a colour that reads on white will not read on
   near-black, so dark needs a lighter step of the same hue. */
:root[data-theme='dark'],
.tx-theme-dark {
  --tx-color-accent: #82a3d8;
  --tx-color-on-accent: #10202e;
}
```

Hover, pressed, subtle fills, selection and the focus ring are all derived from
`--tx-color-accent`, so that one line retheme the whole accent chain. The exception is
`--tx-color-on-accent` — whether white or dark text reads on a fill depends on the fill, so set it
too if you reseed to something light.

Token groups: colour ramps (`--tx-color-*-50…900`), semantic colour, typography, spacing
(`--tx-space-0…24`), radius, elevation, density, motion and z-index. See
[`projects/core/styles/tokens.css`](projects/core/styles/tokens.css) — everything in it is
semver-stable public API.

### Dark mode and scoping

Dark mode follows the OS by default. `data-theme="light" | "dark"` on the root element forces a
choice, and `.tx-theme-dark` / `.tx-theme-light` on any container themes just that subtree.

### Density

`.tx-density-compact` (34 px rows) or `.tx-density-comfortable` (52 px) on any container, or the
`density` input on components that take one.

### Sizing a nested component

Custom properties inherit, so a component can be resized from the outside without reaching into
its markup — this is how the paginator shrinks its own select:

```css
.my-compact-select {
  --tx-density-control-height: 1.875rem;
  --tx-density-control-padding-x: var(--tx-space-2);
}
```

## Accessibility

Interaction and ARIA semantics come from **Angular Aria**, so roving focus, typeahead and
`aria-activedescendant` are handled by the framework rather than reimplemented. Angular Material
is not used anywhere in this library. On top of that:

- Every colour pairing shipped is verified against WCAG 2.2 AA, including the 3:1 non-text
  contrast requirement for control borders and focus indicators
- Reordering works from the keyboard, not only by dragging, and announces each move
- Disabled accordion sections stay focusable and readable rather than leaving the tab order
- Sortable table headers are real buttons and expose `aria-sort`
- Selects report `role="combobox"`, `aria-expanded` and `aria-controls`
- `prefers-reduced-motion` zeroes the motion tokens

## Showcase

A full documentation site lives in `projects/showcase`: an overview, installation, a token
reference, a **live theme editor** that rewrites custom properties on the document root, a page
per component with examples, API tables, keyboard maps and do/don't guidance, and a composition
page that builds a complete working screen from library components only.

```bash
npx ng serve showcase
```

## Deploying the showcase

### Vercel

`vercel.json` at the repo root already sets these, so importing the repo needs no dashboard
changes. If you configure it by hand instead:

| Setting | Value |
| --- | --- |
| Framework Preset | **Other** |
| Install Command | `npm ci` |
| Build Command | `npm run build:showcase` |
| Output Directory | `dist/showcase/browser` |
| Root Directory | *(leave as the repo root)* |
| Node.js Version | 22.x or 24.x |

`build:showcase` builds the library first — the showcase imports
`@tx-angular-design-system/core` through a `paths` mapping onto `dist/core`, so `ng build showcase`
alone fails on a clean checkout.

`vercel.json` also rewrites unmatched paths to `index.html`, which the client-side router needs;
without it a refresh on `/theming` returns 404. Static files are matched before rewrites, so the
favicons and hashed bundles are unaffected.

Leave `<base href="/">` alone — it is already correct for a domain root. Only GitHub Pages needs
`--base-href /<repo>/`, which the Pages workflow passes separately.

### GitHub Pages

`.github/workflows/deploy-showcase.yml` handles it on push to `main`: it sets the base href to the
repo name and copies `index.html` to `404.html`, since Pages has no SPA fallback.

## Development

```bash
npm install
npm run build:lib          # library + schematics -> dist/core
npm run test:lib           # component unit tests (Vitest)
npm run test:schematics    # schematic tests, run against the built output
npx ng serve showcase      # run the showcase app
```

There is also a generator that scaffolds a component with these conventions:

```bash
ng generate @tx-angular-design-system/core:component status-pill
```

Architecture decisions and their rationale are recorded in [DECISIONS.md](DECISIONS.md).
Gaps, trade-offs and sharp edges are listed in [KNOWN-ISSUES.md](KNOWN-ISSUES.md) — read it before
adopting.

## Requirements

| | |
| --- | --- |
| Angular | 22 |
| TypeScript | ~6.0 (**not** 7.x — the Angular compiler rejects it) |
| Browsers | Chrome/Edge 111+, Firefox 121+, Safari 16.2+ (set by `color-mix()` and `:has()`) |

## Licence

MIT. Bundled typefaces (IBM Plex Sans, IBM Plex Mono, Archivo) are SIL Open Font License 1.1.
