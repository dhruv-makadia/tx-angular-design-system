# Known issues

State of `@tx-angular-design-system/core` at **v0.1.0**, before first publish.

Nothing here is a crash or a broken component — the suite is green, both themes are
contrast-clean, and 12 pages x 6 viewports (320-1440) show no horizontal overflow and no pointer
target under 24x24. These are the gaps, deliberate trade-offs and sharp edges a consumer will hit.

Ordered by how likely they are to bite you.

---

## 1. Reseeding the brand needs two accent values, not one

**Severity: high — affects every consumer who rebrands.**

`--tx-color-accent` is a single token, but the accessible accent is different per theme. A colour
chosen to read on white will not read on near-black.

```css
/* Not enough — this applies to both themes */
:root { --tx-color-accent: #0d47a1; }
```

```css
/* Correct */
:root {
  --tx-color-accent: #0d47a1;
  --tx-color-on-accent: #ffffff;
}
:root[data-theme='dark'],
.tx-theme-dark {
  --tx-color-accent: #82a3d8;   /* lighter step of the same hue */
  --tx-color-on-accent: #10202e;
}
```

Everything derived from the accent — hover, pressed, subtle fills, selection, focus ring — follows
automatically in both. Only the accent itself and its text colour must be stated twice.

**Why it is not automatic:** deriving a readable dark accent from an arbitrary light seed was
tested with `color-mix()` and does not work. A single mix ratio either fails contrast for some
hues (deep purple at 45% white still lands at 4.49:1 on cards) or washes the brand out to pastel.
There is no CSS function that adjusts a colour until it clears a contrast threshold.

**Same applies to `--tx-color-on-accent` and `--tx-color-on-status`** — whether white or dark text
reads on a fill depends on that fill's lightness, which is not derivable in CSS.

---

## 2. Disabled controls sit below AA (2.9–3.5:1)

**Severity: low — deliberate, and permitted.**

WCAG 2.2 §1.4.3 exempts "text or images of text that are part of an inactive user interface
component". Disabled labels, placeholders and button text land at 2.9–3.5:1 in both themes.

They remain legible, and the alternative — pushing disabled text to 4.5:1 — makes disabled
controls read as active. Raise `--tx-color-disabled-content` if your context needs more.

Verified: 21 such cases in light, 9 in dark. No non-exempt text falls below AA in either theme.

---

## 3. `$localize` polyfill is mandatory

The library's built-in strings are `$localize` tagged templates. Without
`@angular/localize/init` in the build's `polyfills`, **every component carrying one throws
`ReferenceError: $localize is not defined` at construction and the app renders nothing**.

`ng add` writes it into the `build` and `test` targets. If you install manually, add it yourself:

```jsonc
// angular.json → projects.<app>.architect.build.options
"polyfills": ["@angular/localize/init"]
```

---

## 4. Browser floor: Chrome/Edge 111, Firefox 121, Safari 16.2

Set by two features in the shipped CSS:

| Feature | Used for | Floor |
| --- | --- | --- |
| `color-mix()` | deriving the accent chain, status hovers, selection | Chrome 111, FF 113, Safari 16.2 |
| `:has()` | field focus and hover states | Chrome 105, FF 121, Safari 15.4 |

Both are Baseline Widely Available. Below the floor, colours fall back to unresolved values rather
than degrading gracefully — this is a hard floor, not progressive enhancement.

One softer case: the accordion animates `grid-template-rows` `0fr → 1fr`, which needs Firefox 127+
to *animate*. Below that the panel snaps shut instead of sliding. It always closes.

---

## 5. Table is missing much of the originally specified surface

Shipped: declarative columns, client and server sort, pagination with typed page numbers, sticky
header, three densities, loading and empty states, row click, a row-actions column (optionally
pinned), horizontal scroll.

**Not built:**

- Row selection (single/multi, checkbox column, tri-state header)
- Expandable rows
- Column visibility toggle, column reorder, column resize
- Virtual scroll for large datasets
- An overflow menu for row actions — they all render inline, so keep them to about three
- CSV export hook
- Template-based custom cells (only `value` accessors and `variant` typography)

For very large datasets, use `serverSide` and page on the server. There is no virtualisation, so a
client-side table of tens of thousands of rows will be slow.

---

## 6. Tree is missing selection and drag features

Shipped: nested nodes, lazy children via `hasChildren`, filtering that keeps a match's ancestors
and descendants, single and multi select, a non-collapsible mode, keyboard navigation from Angular
Aria.

**Not built:**

- Checkbox selection with tri-state parents
- Drag to reorder or reparent
- Inline per-node actions
- Expand-all / collapse-all as an API (`[collapsible]="false"` is expand-all-and-stay)

Filtering and `[collapsible]="false"` both force branches open and neither writes that back to your
`expanded` model — deliberate, so clearing the filter, or turning collapsing back on, restores the
user's own expansion state.

---

## 7. Selects have no virtual scroll

`tx-select` and `tx-multi-select` render every option. The filter field appears automatically past
`filterThreshold` (8 by default), which keeps lists usable, but a few thousand options will be
slow to open. Filter server-side and pass a narrowed list.

---

## 8. Showcase API tables are hand-written

They are maintained by hand in each page's `*Api` array and **can drift from the shipped API**.
They should be generated from the emitted `.d.ts`, which would also guarantee they only document
what is actually exported. The extractor is not built.

Treat the source and its TSDoc as authoritative.

---

## 9. Accessibility is verified, not automated

There is no `axe-core` sweep in CI. What exists:

- Hand-written assertions per component for roles, `aria-*`, keyboard and focus behaviour
- A contrast audit script (`scratchpad`, not committed) that walks all 12 showcase pages × 3
  presets in both themes and computes rendered contrast — currently **0 non-exempt failures**
- Interaction semantics come from Angular Aria, which carries its own harnesses

Not covered: screen-reader verification with real AT, reflow at 400% zoom, focus-order review on
every page.

---

## 10. RTL is untested

Out of scope by decision. Logical properties (`margin-inline-*`, `inset-block-*`,
`border-inline-*`) are used throughout, so a retrofit is configuration rather than a rewrite — but
nothing has been rendered or tested in RTL.

---

## 11. Tier 2 components do not exist

`tx-autocomplete`, `tx-datepicker`, `tx-date-range`, `tx-chips`, `tx-tabs`, `tx-menu`,
`tx-tooltip`, `tx-badge`, `tx-avatar`, `tx-breadcrumb`, `tx-pagination` (standalone),
`tx-stepper`, `tx-progress`, `tx-skeleton`, `tx-empty-state`, `tx-alert`, `tx-drawer`,
`tx-file-upload`, `tx-divider`, `tx-tag`.

**The datepicker is the notable gap.** Angular Aria has no date primitive, and a from-scratch
accessible datepicker is expensive. This is the one place Angular Material still earns its weight;
adding it would reintroduce Material as a dependency for that component alone.

---

## 12. No release pipeline

- No Changesets or semantic-release; versions and changelog are manual
- No npm auth, publish workflow or provenance attestation configured
- `.github/workflows/ci.yml` builds, tests and installs the tarball into a fresh app
- `deploy-showcase.yml` publishes the showcase to GitHub Pages

`npm publish` from `dist/core` works, but nothing is automated and nothing is signed.

---

## 13. Showcase initial bundle is 618 kB raw

Above `ng new`'s 500 kB default, so the budget was raised to 700 kB. Pages are correctly
lazy-loaded (each 5–12 kB); the initial chunk is Angular plus the router, CDK and Aria. Transfer
size is ~135 kB gzipped.

This is the **showcase**, not the library. The library's own budget is enforced separately in CI at
400 kB packed; the current tarball is 226 kB, of which ~108 kB is bundled fonts.

---

## 14. The drawer is a drawer, not a modal

Below `48rem` the shell slides the sidebar in over the content behind a scrim. It is dismissible
from the scrim, from `Escape`, and by choosing an item — but it does **not** trap focus, and it does
not mark the content behind it `inert`. Tabbing past the last navigation item walks into the page
underneath, and a screen reader can reach it too.

That is a deliberate limit, not an oversight: making it modal means owning focus restoration and a
scroll lock, which belongs to a dialog primitive rather than to a layout component. If your
application needs a modal drawer, render `tx-sidebar` inside `TxDialogService` instead of the
shell's drawer slot.

Related: the breakpoint is written literally in `app-shell.css`, `header.css` and `sidebar.css`
because a media query cannot read `--tx-app-shell-breakpoint`. Changing the shell's breakpoint means
changing three files, and `menu`/`collapsible` will disagree if you change only one. See D49.

---

## 15. Smaller things

- **Theme editor scope.** Surface and text fields in the showcase editor apply to the theme
  currently on screen. Editing Canvas in light does not change dark — correct, but worth knowing.
- **Selection and scrollbar styling are global.** `::selection` and the scrollbar pseudo-elements
  cannot be reached from component-scoped CSS, so `theme.css` sets them document-wide. Redeclare
  the tokens to opt out.
- **`tx-sidebar` needs two brand slots.** `slot="brand"` for expanded, `slot="brand-compact"` for
  the collapsed rail. Supplying only the first means no brand at all when collapsed.
- **Density is not applied to overlays.** A select panel opened from a compact page renders at the
  density of wherever the CDK overlay container sits, not the trigger's.
- **No `tx-form-field` wrapper.** Field styling is shared through a stylesheet, not a component, so
  there is no way to wrap a third-party control in the design system's field chrome.
- **The header wraps below `30rem`.** Content in `slot="middle"` (typically a search field) takes
  its own line, because projected content is styled by the consumer's stylesheet and cannot be
  given `min-width: 0` from inside the header. On a 320px screen the header is therefore two rows
  tall when a middle slot is filled.
- **A wide table clips its own footer on a phone.** `.tx-table__scroll` scrolls the rows, but the
  paginator sits outside it in the footer. It wraps rather than overflowing, so nothing is lost —
  but at 320px it becomes three stacked rows.
