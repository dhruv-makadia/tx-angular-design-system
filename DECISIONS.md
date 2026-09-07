# Architecture decisions

Running record of every significant choice and why it was made. Newest phase last.

---

## Phase 0 — Foundation

### D1. Angular 22, TypeScript pinned to `~6.0.x`

`@angular/compiler-cli@22.1.5` declares `"typescript": ">=6.0 <6.1"`. At the time of
scaffolding, `typescript@latest` was **7.0.2** — the native port — which the Angular compiler
does not accept. Installing "the latest TypeScript" silently breaks the AOT build.

**Decision:** pin `typescript` to `~6.0.2` (currently 6.0.3) and never float it. Revisit only
when a future Angular release widens the range.

### D2. Angular Aria for interaction, CDK for infrastructure, no Angular Material

The original brief mandated wrapping Angular Material. Angular Aria went stable in v22 and
covers `accordion`, `combobox`, `grid`, `listbox`, `menu`, `tabs`, `toolbar`, `tree` — each with
test harnesses, peering only on `@angular/core` and `@angular/cdk`. Between Aria and the CDK
(`dialog`, `overlay`, `drag-drop`, `text-field`, `scrolling`, `a11y`, `layout`), **every Tier 1
component is covered without Material**.

**Decision:** Aria supplies interaction and ARIA semantics; the CDK supplies overlays,
positioning and scrolling. **Angular Material is not used at all** — not as an implementation
dependency, and no longer as a theming target either.

An earlier revision shipped a `--mat-sys-*` bridge so that a consuming app using Material directly
would inherit our tokens. That was removed once it was confirmed nothing in the library needs
Material: carrying a bridge for a package we do not depend on is upkeep with no user. A consumer
who wants Material themed from our tokens can map `--mat-sys-*` to `--tx-*` in their own
stylesheet — the tokens are public API and the mapping is a dozen lines.

**Consequence:** `@angular/material` is not installed and not a peer dependency. Revisit only for
a datepicker, which Aria has no equivalent for; a from-scratch accessible datepicker is expensive
and that is the one place Material still earns its weight.

### D3. Runtime theming is real (retained for the record)

Material v22's `mat.theme()` emits component tokens that *reference* `--mat-sys-*` custom
properties rather than baking literal values (`core/tokens/m3/_theme.scss` maps every system key
to the variable **name**), and derives state layers with CSS `color-mix()` at paint time
(`core/tokens/_m3-utils.scss`).

This was verified before D2 was revised, and is recorded because it is the answer to "can we
theme Material from our tokens without a Sass build?" — yes, in plain CSS, because derivation
happens in the browser. Only the M3 path (`mat.theme()`) behaves this way; the legacy M2 API
bakes literals. It no longer applies to this repo, but it is the note to reach for if a consuming
app wants to bridge Material itself.

### D4. Option B — no Tailwind classes inside library components

Library components are authored in plain CSS against the tokens.

- A consumer's Tailwind build purges classes it cannot see, and would need an `@source` directive
  pointing into `node_modules`. That failure is **silent and production-only** — dev builds look
  correct — which is the worst possible failure mode for a design system.
- It would make Tailwind a hard dependency of the library. Other internal apps we do not control
  would be forced onto it.
- Scanning `node_modules` costs build time in every consuming app, forever.

Tailwind is still offered *to the consumer app* via `styles/tailwind.css`. Nothing we ship can be
purged.

### D5. `@theme inline`, not `@theme`

The Tailwind bridge maps tokens like `--color-accent: var(--tx-color-accent)`. Plain `@theme`
emits utilities that reference `--color-accent`, which CSS resolves **where it is defined**
(`:root`) rather than where it is used. Subtree scopes such as `.tx-theme-dark` would be ignored
and opacity modifiers (`bg-accent/50`) would break.

**Decision:** the bridge uses `@theme inline` throughout. This is correctness, not style.

### D6. Self-hosted fonts, ~108 KB

IBM Plex Sans (variable), Archivo (variable) and IBM Plex Mono 400/600, latin subset, weight axis
only. All three are **OFL-1.1**, which explicitly permits embedding, self-hosting and
redistribution.

| File | Face | Size |
| --- | --- | --- |
| `tx-sans.woff2` | IBM Plex Sans Variable | 44.6 KB |
| `tx-display.woff2` | Archivo Variable | 34.1 KB |
| `tx-mono-400.woff2` | IBM Plex Mono 400 | 14.4 KB |
| `tx-mono-600.woff2` | IBM Plex Mono 600 | 15.3 KB |
| | **Total** | **108.4 KB** |

Italics are excluded; adding them roughly doubles the payload. No CDN reference anywhere, so the
library works in air-gapped builds. `--tx-font-sans` remains overridable.

### D7. Browser floor: Chrome/Edge 105, Firefox 121, Safari 15.4 (superseded by D35)

Originally set by `color-mix()` and `oklch()`, which Angular Material's theming relies on. With
Material removed (D2), the shipped CSS uses neither: OKLCH was used to *generate* the ramps, but
the tokens ship as plain hex.

The floor is now set by **`:has()`**, used for field focus and hover states — Chrome 105,
Safari 15.4, Firefox 121. Everything else we use (logical properties, space-separated `rgb()`
with slash alpha, custom properties) is older than that.

Firefox 121 (December 2023) is the binding constraint. If a consumer needs to go below it, the
`:has()` rules degrade to "no focus ring on the field wrapper" rather than breaking layout, and
could be replaced with a host class if it ever matters.

---

## Phase 1 — Theme system

### D8. Visual direction: "Field Kit" with "Instrument" data treatment

Warm neutrals (OKLCH hue 85), soft geometry (10 px panels / 7 px controls), two-layer shadows,
green promoted to the primary action colour at its accessible depth. Borrowed from the
"Instrument" direction: monospaced, uppercase, letter-spaced micro-labels and column headers, and
`font-variant-numeric: tabular-nums` for every identifier and measurement.

Rationale: the first consumer's screens are long configuration forms and dense review tables, read
for minutes at a time. Warm neutrals are also the cheapest single move away from looking like
stock Material.

### D9. The seed palette was corrected for accessibility

The reference palette failed WCAG 2.2 AA in five of seven roles. Measured, then fixed:

| Role | Before | After | Fix |
| --- | --- | --- | --- |
| Primary button, white label | 2.43:1 | 5.48:1 | white label only on `primary-700`, not the brighter greens |
| Green text | 4.23:1 | 5.26:1 | `primary-700` `#3c7700` |
| Muted text on canvas | 4.19:1 | 7.08:1 | `neutral-700` |
| Warning text | 2.56:1 | 4.96:1 | split fill and text tokens |
| Input border | 1.24:1 | 3.20:1 | new `--tx-color-border-strong` |

Every ramp step was generated in OKLCH and each pairing verified programmatically.

### D10. Two border tokens, not one

WCAG 2.2 §1.4.11 requires 3:1 for boundaries that identify a control, but a decorative hairline
between rows has no such floor — and a border dark enough for a control looks heavy as a divider.
One token cannot serve both.

- `--tx-color-border` — decorative separators, no contrast floor
- `--tx-color-border-strong` — anything bounding an interactive control, ≥3:1

### D11. Dark mode covers all three viewer states

An explicit choice stamps `data-theme` on the root; the default "system" setting stamps nothing.
Tokens are therefore declared three times: bare `:root` (complete light palette),
`@media (prefers-color-scheme: dark)` guarded as `:root:not([data-theme='light'])`, and
`:root[data-theme='dark']`. Only tokens are redefined, never component rules, so `.tx-theme-dark`
on a container themes exactly that subtree.

### D12. Density is a token scope, not a component input plumbed everywhere

`.tx-density-compact` / `.tx-density-comfortable` redefine `--tx-density-*`. Components read those
variables, so density can be set per-subtree in CSS or per-component via an input. Standard is
44 px rows; compact is 34 px.

---

## Phase 3 — Components

### D13. `model()` provides its own change output

An explicit `pageChange = output<...>()` alongside `page = model<...>()` is a compile error
(NG1054): a model already emits `<name>Change`. Public API is therefore `[(sort)]`, `[(page)]`,
`[(value)]` with the implicit `sortChange` / `pageChange` / `valueChange` outputs.

### D14. Listbox selection must be explicit

Angular Aria's `Listbox` defaults to `selectionMode="follow"`, where moving focus selects the
focused option. In a select that means arrow-keying through the list silently rewrites the form
value.

**Decision:** both selects set `selectionMode="explicit"`. Covered by a regression test
(*does not select an option merely by focusing it*).

### D15. Ignore the listbox's initialisation echo

`ngListbox` emits `valueChange` while initialising, echoing back the value it was given. Treating
that as a user selection closed the panel the instant it opened. Both selects now ignore a
`valueChange` equal to the current value.

### D16. Outside-click, not a backdrop

With a CDK backdrop, the click that opens the panel also reaches `backdropClick` and closes it
again. Replaced with `(overlayOutsideClick)`, guarded by checking that the event target is not
inside the component host. Panel width now comes from `cdkConnectedOverlayMatchWidth` rather than
a manual `offsetWidth` measurement, which also removes a layout read.

### D17. Both form contracts on every control

Each form control implements `ControlValueAccessor` (reactive forms) **and** satisfies Signal
Forms' structural `FormValueControl<V>` contract — a `value` model plus optional `disabled` /
`readonly` inputs. No `NG_VALUE_ACCESSOR` boilerplate is needed for the latter; the signal-first
API we already wanted happens to be exactly the shape Signal Forms expects.

### D18. Client-side sorting never mutates the caller's array

`TxTable` copies before sorting. Comparison is null-safe and type-aware: numbers numerically,
dates by timestamp, everything else via `localeCompare` with `numeric: true`. Covered by tests.

### D19. Built-in strings use `$localize`

All user-facing strings carry stable ids (`@@tx.select.clear`, `@@tx.paginator.range`, …) and are
extractable with `ng extract-i18n`. `@angular/localize` is an **optional** peer dependency:
without it, the default English strings compile through unchanged.

### D20. Style assets ship as package exports

`ng-packagr` bundles only the entry point, and its generated `exports` map would block deep
imports. `ng-package.json` copies `styles/**` as assets, and `package.json` declares explicit
subpath exports so `@tx-angular-design-system/core/styles/theme.css` resolves. ng-packagr merges
these with its generated entries.

---

### D21. The CDK's structural overlay CSS must be imported

Overlays were rendering at their content's width rather than the trigger's, because
`@angular/cdk/overlay-prebuilt.css` was never imported: without it `.cdk-overlay-pane` has no
`position: absolute` and no `display: flex`, so the width the CDK sets is not honoured.

`styles/theme.css` now imports `@angular/cdk/overlay-prebuilt.css` and
`@angular/cdk/a11y-prebuilt.css`. Bare package specifiers resolve fine in CSS through the Angular
build, so this costs the consumer nothing.

Two related fixes: overlay panels set `width: 100%` (the pane is `display: flex`, so a lone child
otherwise shrink-wraps), and panels open with `cdkConnectedOverlayOffsetY = 4` so they do not butt
against the field. Verified in a real browser: field 375 px, panel 375 px, 4 px gap.

---

## Phase 2 — `ng add` schematic

### D22. Schematics ship as CommonJS inside an ESM package

ng-packagr marks the published package `"type": "module"`. Node then treats the compiled
CommonJS schematics as ESM and `ng add` fails with *"exports is not defined in ES module scope"* —
a failure that tests against source would never surface, because it exists only in the published
layout.

**Decision:** the schematics build emits a nested `dist/core/schematics/package.json` containing
`{"type": "commonjs"}`, scoping just that folder back to CommonJS. This is what
`@angular/material` ships. It is generated by `tools/write-schematics-pkg.mjs` at build time
rather than kept in source, so ng-packagr never mistakes it for a secondary entry point.

Schematic tests run against `dist/`, not source, precisely so this class of bug is caught.

### D23. The Angular version is read from the host, never hardcoded

`ng add` reads `@angular/core` from the host `package.json` and derives the major, installing peer
dependencies as `^<major>.0.0`. A host on Angular 23 gets Angular 23 peers without a library
release. Covered by a test that runs the schematic against a v23 host.

### D24. The stylesheet edit is a replaceable block

Imports are written between `/* --- @tx-angular-design-system/core --- */` markers. A second run
replaces the block rather than appending, so `ng add` is idempotent — including the cascade order
(Tailwind, theme, bridge, overrides), which is load-bearing and easy to break by hand.

The overrides stub is created once and never overwritten: after the first run it is the user's
file.

---

## Phase 3 — Tier 1 components (batch 1)

### D25. Native elements where the platform already does the work

`tx-button` renders a real `<button>`; `tx-checkbox`, `tx-toggle` and `tx-radio-group` render real
`<input>` elements, clipped to `opacity: 0` rather than `display: none` so they keep focus, form
participation, autofill and their place in the accessibility tree. `tx-radio-group` wraps them in
`<fieldset>`/`<legend>`, which gives arrow-key navigation and group labelling for free.

This is why those four use no Aria primitive: Aria has no checkbox, radio or switch, and the
platform's own implementation is better than anything we would write.

`tx-toggle` is a checkbox with `role="switch"` — the pattern assistive technology expects for a
control that takes effect immediately rather than on submit.

### D26. Icons are inline SVG from a path-geometry registry

Not an icon font (payload, FOUT, poor screen-reader behaviour) and not a sprite sheet (an extra
request, awkward offline). Icons register as **path data**, never markup, so nothing passes
through `innerHTML` and a registered icon cannot carry script or external references. Unknown
names render nothing rather than throwing.

`provideTxIcons({...})` adds to the set at bootstrap. `tx-icon` is `aria-hidden` unless given a
`label`.

### D27. A shared field stylesheet, not a `tx-form-field` wrapper component

Label, control frame, hint and error styling are shared through `src/lib/shared/field.css`, pulled
in via `styleUrls`. A wrapper component would have meant content projection through an extra layer
for every control, complicating focus management and label association for no user-visible
benefit. Angular still scopes the rules per component, so there is no global leakage.

### D28. Dark mode had a token collision

`--tx-color-disabled-surface` and `--tx-color-surface-raised` both resolved to `#353028` in dark,
so a disabled control sitting on a card was invisible. Caught by looking at the rendered page, not
by a test — contrast checks compare foreground against background and had no reason to compare two
background tokens with each other.

Dark now uses `--tx-color-disabled-surface: #413d34` with `--tx-color-disabled-content: #8a857a`.
Worth remembering: **two background tokens that must be distinguishable from each other need
checking too**, not only text-on-background pairs.


### D29. `ng add` must register the `$localize` polyfill

Installing `@angular/localize` is not enough. The library's built-in strings are `$localize`
tagged templates, and without `@angular/localize/init` in the build's `polyfills` the tag is never
defined — every component carrying one throws `ReferenceError: $localize is not defined` at
construction and the app renders a blank page.

This was only caught by installing the packed tarball into a real app and loading it in a browser.
Component tests, schematic tests and even `ng build` all passed: the failure is at runtime, in the
consumer, and nowhere else.

**Decision:** `ng add` writes the polyfill into the `build` and `test` targets, preserving any the
host already had, and never duplicating it on a second run. Three schematic tests cover it. The
CI job that installs into a fresh app now closes the loop.

---

## Phase 3 — Tier 1 components (batch 2)

### D30. The paginator uses `tx-select`, not a native `<select>`

A native `<select>` renders the operating system's own widget: it ignores the token set, cannot be
themed in dark mode, and looked visibly foreign inside an otherwise consistent table footer.

**Decision:** the page-size control is a `TxSelect`. It is sized through custom properties
(`--tx-density-control-height` on the host) rather than by reaching into the component's internals
— which is the same escape hatch consumers get, so it doubles as proof that the mechanism works.

`TxSelect` gained an `ariaLabel` input for exactly this case: a select with no visible label still
needs an accessible name.

### D31. Page numbers are typed, not only stepped

Arrow buttons alone make page 40 of 200 a chore. The paginator now has a page field: type a
number and press `Enter`, or step with the arrow keys. It accepts digits only (a stray letter can
never become `NaN`), clamps out-of-range entries rather than showing an empty table, and abandons
the edit on `Escape`.

Editing state is kept separate from the live page in a `draft` signal, so the field shows what the
user is typing without the table jumping on every keystroke.

### D32. Navigation is links, not a listbox

`tx-sidebar` renders `<nav>` → `<ul>` → anchors and buttons. It is deliberately *not* built on
Aria's listbox: navigation is a set of destinations, and treating it as a single-select widget
breaks `Tab` order, open-in-new-tab, and the browser behaviours people expect from a sidebar.

It is also router-agnostic — `activeId` in, `itemSelect` out — so the library needs no dependency
on `@angular/router` and the app stays in charge of navigation. The showcase derives `activeId`
from the URL, which is why a refresh or a deep link stays correct.

Collapsing to a rail clips labels rather than hiding them (`clip-path`, not `display: none`), so
every item keeps its accessible name.

### D33. `tx-header` and `tx-app-shell` hold no navigation state

The header's menu button reports that it was pressed; it does not know whether a drawer exists.
The shell owns layout only. Keeping state out of both means an app can drive them from a router, a
signal, or nothing at all, and neither component needs to guess.


### D34. Accent variants are derived, not ramp steps

`--tx-color-accent-hover`, `-active`, `-subtle`, `-muted` and `--tx-color-selected` pointed at
`--tx-color-primary-800`, `-50`, and so on. Overriding `--tx-color-accent` alone therefore left
green hover and tonal states behind on an otherwise red theme — the headline promise of the token
system did not actually hold.

They are now derived with `color-mix()` from `--tx-color-accent`: darkened for hover and pressed in
light, lightened in dark, mixed into the surface for subtle fills. One override now really does
retheme the accent chain.

`--tx-color-on-accent` stays explicit, because whether white or dark text reads on a fill depends
on that fill's lightness and cannot be derived. Reseeding to a light accent means setting both.

**Consequence:** the shipped CSS now uses `color-mix()`, which moves the browser floor (D7).

### D35. Browser floor, revised again: Chrome 111, Firefox 121, Safari 16.2

D7 lowered the floor to `:has()` when Material was removed. D34 puts `color-mix()` back in the
shipped CSS — Chrome 111, Firefox 113, Safari 16.2 — so the binding constraints are now Chrome 111
and Safari 16.2, with Firefox still pinned at 121 by `:has()`.

All three are Baseline Widely Available. The trade is deliberate: a working override contract is
worth more than support for browsers three years old.

### D36. Selection and scrollbars are themed globally

A blue selection highlight and a grey scrollbar are the two things browsers style themselves, and
the two that make an otherwise themed app look unthemed. `::selection` and the scrollbar
pseudo-elements cannot be reached from component-scoped styles, so `theme.css` sets them at the
document level from `--tx-color-selection` and `--tx-scrollbar-*`.

`scrollbar-color` is inherited so one declaration on `:root` suffices; `scrollbar-width` is *not*
inherited, so it needs a `*` rule. Consumers opt out by redeclaring the tokens.

### D37. The sidebar takes two brand slots

Collapsing to a 3.5 rem rail clipped the wordmark mid-glyph, leaving a sliver of the first letter
beside the icon that read as a rendering fault. The component cannot know which part of projected
content is the mark and which is the text.

`slot="brand"` shows when expanded, `slot="brand-compact"` when collapsed. Supply neither and the
header collapses away rather than clipping something.

---

## Phase 3 — Tier 1 complete

### D38. The accordion is Aria's, the disabled state is soft

`tx-accordion` / `tx-accordion-panel` wrap `ngAccordionGroup` / `ngAccordionTrigger` /
`ngAccordionPanel`, so expansion, roving focus and the `aria-controls` wiring are the framework's.

A disabled panel is **soft-disabled** — `aria-disabled="true"` with `tabindex="0"` — not a native
`disabled` button. A native disabled button leaves the tab order, which hides the section from
keyboard and screen-reader users entirely; soft-disabled keeps it discoverable and readable while
refusing activation. A test asserts this, because "fixing" it to `disabled` would look like a
correction.

### D39. Tree filtering keeps ancestors and descendants

Filtering a tree to the matching nodes alone leaves each hit orphaned from its path — you see
"Gearbox" with no idea which line it belongs to. `filterTree` keeps a node when it matches, when a
descendant matches (so the path survives), and keeps its subtree when it matches itself.

Matches are also force-expanded, otherwise the hits stay hidden inside collapsed branches. That
derived expansion is deliberately **not** written back to the `expanded` model: committing it
would fight the user's own expansion state once the filter clears.

### D40. Keyboard reordering is not optional

The CDK gives pointer dragging. Everything else in `tx-reorder-list` — the focusable handle per
row, arrow keys to move, `Home`/`End` to jump, focus following the item rather than the position,
and a live region announcing "X moved to position 2 of 3" — is written here, because a reorder
control that only works by dragging is unusable without a mouse and therefore unfinished.

The list is controlled and never mutates the array it is given, which a test enforces.

### D41. Dialogs and toasts are services, not components

Neither is placed in a template. A dialog is an event in a flow, not part of a page's structure,
and putting it in the template makes positioning, focus trapping and teardown that page's problem.
`TxDialogService` delegates all of that to the CDK.

Two deliberate API choices:

- `confirm()` resolves `false` on *any* dismissal, so callers never have to distinguish "cancelled"
  from "pressed Escape" from `undefined`.
- Toast politeness is derived from kind, not passed per call: errors are `assertive`, everything
  else `polite`. Getting this wrong is how screen-reader users end up interrupted by "saved" while
  typing. Errors also default to no timeout — the one message you must not miss should not expire
  while you are reading something else.


### D42. `inert` is not `hidden` — the accordion had to collapse its own body

Angular Aria marks a collapsed accordion panel `inert="true"`, which removes it from interaction
and the accessibility tree. It does **not** hide it. With no styling keyed off that attribute,
every section's body stayed on screen at once and the accordion looked permanently open — the
toggle was working the whole time.

The body now animates `grid-template-rows` from `0fr` to `1fr`, keyed off `:not([inert])`, which
collapses content of unknown height without measuring it. Where that animation is unsupported the
track still resolves, so the panel snaps shut rather than failing to close.

Two things this cost, worth remembering:

- **jsdom could not have caught it.** The unit tests asserted `aria-expanded` and the model, both
  of which were correct. The failure was purely visual. The regression test now asserts `inert`,
  which is the attribute the stylesheet keys off, and the browser check measures the rendered
  height.
- Padding has to be zeroed while closed, or a collapsed `0fr` row still leaves a sliver of height.

---

## Pre-publish hardening

### D43. The accent chain is derived; the accent itself is theme-scoped

`--tx-color-accent-hover`, `-active`, `-subtle`, `-muted` and `--tx-color-selected` pointed at
fixed ramp steps, and the dark ones were literal green `rgb()` values. Overriding
`--tx-color-accent` therefore left green hover and tonal states on a red theme — the token
system's headline promise did not hold. They now derive from the accent with `color-mix()`.

The accent *itself* could not be made automatic. A single mix ratio against white either fails
contrast for some hues (deep purple lands at 4.49:1 on dark cards even at 45%) or washes the brand
out to pastel, and CSS has no function that adjusts a colour until it clears a threshold.
Reseeding therefore means stating the accent twice — once per theme — which is what the shipped
palette itself does (`primary-700` light, `primary-400` dark). Documented in KNOWN-ISSUES §1.

### D44. Dark needed a real elevation ladder

Three token pairs resolved to the same literal in dark: `surface-variant` = `surface-raised`
(so an active segmented pill was invisible against its own track) and `border` =
`disabled-surface` (so a disabled field's border vanished into its own fill).

The dark surfaces were re-solved as an ascending ladder — canvas < surface < variant < raised <
border < disabled — under 21 simultaneous constraints: every text token clears AA on all four
surfaces, `border-strong` clears 3:1 on all four, and each neighbouring pair is separated enough
to be told apart. Solved numerically in OKLCH rather than picked by eye.

### D45. Filled status buttons need a theme-flipped text colour

The danger button hardcoded `color: #ffffff`. In dark the danger fill is a *light* red, where
white text is 2.56:1. Added `--tx-color-on-status`, white in light and near-black in dark, and
derived the hover with `color-mix()` so it darkens in light and lightens in dark rather than
jumping to a fixed ramp step and flipping the text contrast again.

### D46. The theme editor writes to the active theme's scope

Overrides were applied as inline styles on `:root`, which beats `:root[data-theme='dark']`. Two
consequences: a preset that set surfaces made dark mode unreadable, and **editing any token while
in dark mode silently did nothing**.

The editor now emits a real stylesheet with `:root { }` and `:root[data-theme='dark'] { }` blocks,
and routes each edit to whichever theme is on screen. That is also the shape a consuming app must
write, so the editor teaches the correct pattern instead of a shortcut that breaks on theme
switch. The generated CSS is shown on the page.

### D47. Contrast is audited by walking the rendered pages

Token-level contrast checks miss what actually composes on screen. A Puppeteer script walks all 12
showcase pages × 3 brand presets × both themes, resolves each text node's real background by
climbing for the first opaque ancestor, and computes contrast against the WCAG threshold for its
size and weight.

It separates *inactive* controls, which §1.4.3 exempts, from real failures — and it must, because
a disabled radio's `disabled` attribute sits on a sibling `<input>`, so `closest('[disabled]')`
alone misclassifies the label as a failure.

Result: **0 non-exempt failures in either theme**. Two real bugs were found this way that no unit
test would have caught: the danger button (D45) and the active sidebar badge at 3.89:1, now a
solid accent pill at 5.5:1 or better for every seed tested.

### D48. The select chevron belongs inside the trigger

The chevron was a sibling of the trigger button with `pointer-events: none`, so a click on it fell
through to the wrapper `div`, which has no handler: **clicking the chevron did nothing, and only
the text area opened the panel**. Both selects had it, and so did every select derived from them —
including the paginator's page-size control.

The chevron now lives inside the trigger, where it is part of the button's hit area and
`pointer-events: none` simply forwards the click to the button. That leaves no room in the flow for
the clear button, which is now positioned over the trigger and spaced clear of the chevron; the
value reserves that column so a long label ellipsises rather than running underneath.

`margin-inline-start: auto` pushes the multi-select's chevron to the trailing edge whether the
trigger holds chips or only a placeholder — flex growth on the value alone did not cover both.

Two regression tests assert the structural fact rather than the symptom: the chevron resolves to
`.closest('.tx-select__trigger')`, and the clear button does not.

## Small screens

### D49. One navigation control at a time, chosen by a repeated breakpoint

`tx-header` gained `menu: 'auto' | 'always' | 'never'` and `tx-sidebar` gained
`collapsible: 'auto' | 'always' | 'never'`, both projected onto the host as `data-menu` /
`data-collapsible`. Under `auto` the two are mutually exclusive: below `48rem` the shell turns the
sidebar into an overlay drawer, so the header shows its toggle and the sidebar hides its collapse
control; at or above it the sidebar is permanently on screen, so the toggle would open nothing and
disappears while the collapse control returns. Verified at 320/414/767/769/1024/1440: `menu`
visible ⟺ `collapse` hidden, with the flip exactly on the boundary.

The breakpoint is now written literally in three stylesheets (`app-shell.css`, `header.css`,
`sidebar.css`) instead of being read from `--tx-app-shell-breakpoint`. A media query cannot read a
custom property — `@media (max-width: var(...))` is invalid — and container queries are the wrong
instrument here because the header and the sidebar need to agree about the *shell's* width, not
their own. `never` and `always` remain the escape hatch for anyone whose layout does not use the
shell; the showcase's own header/sidebar demos use them for exactly that reason.

The shell also grew a scrim and `(drawerClose)`. Consistent with `tx-header`, it reports the
dismissal rather than owning the state: `drawerOpen` stays an input, and the scrim click and
`Escape` both emit. The scrim is `display: none` above the breakpoint and while shut, so it costs
nothing in the desktop layout and never intercepts a pointer.

### D50. Responsive faults are found by measurement, not by looking

A second Puppeteer pass (`responsive.js`) walks 12 pages x 6 viewports (320-1440) and reports four
classes of fault: horizontal page overflow, elements past the right edge with no scrollable
ancestor, pointer targets under 24x24 (WCAG 2.5.8), and text clipped by a fixed height. The first
run found 2 overflowing pages, 49 escaping elements and 7 undersized targets; all are now zero.

Three of the causes were structural rather than cosmetic, and none were visible without measuring:

- `flex-direction: column` inherited `flex-wrap: wrap` from `.example__stage`, so the demo stage
  laid out in *columns* sized to their max-content, and a wide table pushed the page out instead of
  scrolling inside its own container.
- `grid-template-columns: 1fr` is `minmax(auto, 1fr)`; the theming editor's panel won the track
  with its min-content width. `minmax(0, 1fr)` is the fix, and the same reasoning turned twelve
  grid tracks into `minmax(min(Xrem, 100%), 1fr)`.
- Content projected into `.tx-header__middle` is styled by the *consumer's* stylesheet, so
  `.tx-header__middle > * { min-width: 0 }` never matched it. The container had to solve it:
  below `30rem` the header wraps and the middle slot takes its own line.

The undersized targets were all visually-hidden native inputs (18x18 checkbox and radio, 36x20
toggle). Their hit areas are bled out with negative `inset` on the absolutely positioned input, so
nothing moves and a checkbox with no label — a table row selector — still clears 24x24.

### D51. Row actions are data, and they are not a row selection

`tx-table` gained `actions: TxTableAction<T>[]`, rendered as buttons in a trailing column, with
`actionsHeader`, `actionsWidth`, `actionsSticky` and an `actionSelect` output. Columns were already
declared as data; actions had no reason to be the exception, and a content-projection API would have
meant the caller assembling a cell per row.

Four decisions inside it:

- **`disabled(row)` and `hidden(row)` are different things.** Disabled means *not right now*: the
  button stays, so the column does not reflow between rows and the control keeps its position under
  the pointer. Hidden means *not applicable to this kind of row at all*, and it is removed. The
  showcase demonstrates both on the same table.
- **Choosing an action is not selecting the row.** The handler calls `stopPropagation`, so a table
  can carry both `rowClick` and actions without the click being ambiguous — which reverses an
  earlier piece of guidance that said not to combine them.
- **`ariaLabel(row)` exists because ten buttons called "Delete" are indistinguishable.** An
  icon-only action always gets a name (falling back to `label`); a text action gets one only when
  the caller supplies row-specific wording, since it already reads as its own label. The `title`
  tooltip is icon-only — repeating visible text is noise.
- **Disabled needs opacity, not just a colour.** A ghost button has no surface to grey out, and in
  dark theme `--tx-color-disabled-content` (#aaa79f) sits 6% off the muted ink it replaces
  (#b6b2aa). Measured in the browser, the two were nearly indistinguishable; `opacity: 0.55` carries
  the difference in both themes. Disabled controls are exempt under WCAG 1.4.3, so dimming is safe.

`actionsSticky` pins the column while the table scrolls sideways — worth it on a phone, so it is
opt-in rather than automatic. Its hairline is a pseudo-element, not a border: with
`border-collapse: collapse` the *table* paints the borders and a collapsed border does not travel
with a sticky cell. `position: sticky` is itself a containing block, so an absolutely positioned
`::before` keeps the rule logical instead of forcing a physical `box-shadow`.

---

## Open







- **RTL** — out of scope by decision. Logical properties (`margin-inline-*`, `inset-block-*`) are
  used throughout anyway, so a future retrofit is configuration rather than a rewrite.
- **Publishing** — public npm. Auth, provenance and the release workflow are not yet set up.
- **Tier 2** — autocomplete, datepicker, chips, tabs, menu, tooltip, badge, avatar, breadcrumb,
  stepper, progress, skeleton, empty-state, alert, drawer, file-upload, divider, tag.
- **API tables are hand-written.** They should be generated from the emitted `.d.ts` so they
  cannot drift from the shipped surface. The extractor is not built yet.
- **Publishing** — public npm, but no release workflow, provenance or Changesets setup.
- **Axe** — a11y is covered by hand-written assertions, not yet by automated axe-core runs.
