import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  TxButton,
  TxCard,
  TxCheckbox,
  TxInput,
  TxSelect,
  TxSelectOption,
  TxTable,
  TxTableColumn,
  TxToggle,
} from '@tx-angular-design-system/core';
import { DemoExample, DemoPage } from '../shared/demo';
import { EDITABLE_TOKENS, ThemeService } from '../theme.service';

interface PreviewRow {
  ref: string;
  item: string;
  qty: number;
}

/*
 * Brand-only presets.
 *
 * An earlier version also set canvas, surface and text colours. Those are
 * theme-dependent, and overriding them on :root beat the dark-theme block —
 * switching to dark with a preset active produced dark text on a light canvas.
 * Reseeding a brand should not mean restating every surface, which is the whole
 * point of deriving the accent chain.
 */
const PRESETS: readonly {
  name: string;
  light: Record<string, string>;
  dark: Record<string, string>;
}[] = [
  { name: 'Shipped', light: {}, dark: {} },
  {
    name: 'Cobalt',
    light: { '--tx-color-accent': '#0d47a1', '--tx-color-on-accent': '#ffffff', '--tx-radius-md': '0.25rem', '--tx-radius-lg': '0.375rem' },
    // A colour picked to read on white does not read on near-black, so the dark
    // theme gets a lighter step of the same hue. Verified at 4.6:1 on cards.
    dark: { '--tx-color-accent': '#82a3d8', '--tx-color-on-accent': '#10202e' },
  },
  {
    name: 'Ember',
    light: { '--tx-color-accent': '#a8332a', '--tx-color-on-accent': '#ffffff', '--tx-radius-md': '0.75rem', '--tx-radius-lg': '1rem' },
    dark: { '--tx-color-accent': '#d59086', '--tx-color-on-accent': '#2a1a17' },
  },
];

@Component({
  standalone: true,
  imports: [
    DemoPage,
    DemoExample,
    TxCard,
    TxButton,
    TxInput,
    TxSelect,
    TxCheckbox,
    TxToggle,
    TxTable,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <demo-page
      eyebrow="Foundations"
      heading="Theming"
      lede="Change a value on the left and watch every component follow. Nothing here is
            simulated — the editor emits a real stylesheet, scoped per theme, exactly as a
            consuming app would write it."
    >
      <div class="editor">
        <aside class="editor__panel" aria-label="Theme editor">
          <div class="editor__head">
            <div>
              <h2>Tokens</h2>
              <p class="editor__scope">
                Editing the <strong>{{ theme.mode() }}</strong> theme
              </p>
            </div>
            <tx-button variant="text" size="sm" (activated)="theme.resetOverrides()">Reset</tx-button>
          </div>

          <div class="presets" role="group" aria-label="Presets">
            @for (preset of presets; track preset.name) {
              <button
                type="button"
                class="preset"
                [class.preset--active]="activePreset() === preset.name"
                (click)="applyPreset(preset.name)"
              >
                {{ preset.name }}
              </button>
            }
          </div>

          <div class="fields">
            @for (token of tokens; track token.name) {
              <div class="field">
                <label [attr.for]="token.name">
                  {{ token.label }}
                  @if (token.hint) {
                    <span class="field__hint">{{ token.hint }}</span>
                  }
                </label>

                @if (token.kind === 'color') {
                  <div class="field__color">
                    <input
                      type="color"
                      [id]="token.name"
                      [value]="valueOf(token.name, token.initial)"
                      (input)="set(token.name, $any($event.target).value)"
                    />
                    <code>{{ valueOf(token.name, token.initial) }}</code>
                  </div>
                } @else {
                  <input
                    class="field__text"
                    type="text"
                    [id]="token.name"
                    [value]="valueOf(token.name, token.initial)"
                    (input)="set(token.name, $any($event.target).value)"
                  />
                }
              </div>
            }
          </div>
        </aside>

        <div class="editor__preview">
          <tx-card variant="outlined">
            <span slot="title">Live preview</span>
            <span slot="subtitle">Ordinary components — nothing here knows about the editor</span>

            <div class="preview">
              <div class="preview__row">
                <tx-button variant="filled">Filled</tx-button>
                <tx-button variant="tonal">Tonal</tx-button>
                <tx-button variant="outlined">Outlined</tx-button>
                <tx-button variant="text">Text</tx-button>
              </div>

              <div class="preview__row preview__row--grid">
                <tx-input label="Reference" [(value)]="ref" clearable />
                <tx-select label="Owner" [options]="owners" [(value)]="owner" clearable />
              </div>

              <div class="preview__row">
                <tx-checkbox [(checked)]="checked" label="Confirmed" />
                <tx-toggle [(checked)]="toggled" label="Notify" />
              </div>

              <tx-table [data]="rows" [columns]="columns" density="compact" label="Preview" />
            </div>
          </tx-card>
        </div>
      </div>

      <demo-example
        heading="The CSS this produces"
        note="Live output from the editor above — paste it into your own stylesheet and you get exactly what you see here."
        [code]="theme.css() || cssSnippet"
        column
      >
        <p class="prose">
          Note the two scopes. <strong>The accent is theme-dependent</strong>: a colour chosen to
          read on white will not read on near-black, so reseeding a brand means supplying a lighter
          step for dark as well. Everything derived from it — hover, pressed, subtle fills,
          selection, the focus ring — follows automatically in both.
        </p>
      </demo-example>

      <demo-example heading="Scoping to part of a page" [code]="scopeSnippet" column>
        <div class="scoped">
          <div class="scoped__half">
            <p class="scoped__label">Document theme</p>
            <tx-button variant="filled">Save</tx-button>
          </div>
          <div class="scoped__half tx-theme-dark">
            <p class="scoped__label">.tx-theme-dark</p>
            <tx-button variant="filled">Save</tx-button>
          </div>
        </div>
      </demo-example>
    </demo-page>
  `,
  styles: [
    `
      .editor {
        display: grid;
        grid-template-columns: minmax(0, 20rem) minmax(0, 1fr);
        gap: var(--tx-space-5);
        align-items: start;
      }
      @media (max-width: 60rem) {
        .editor {
          grid-template-columns: 1fr;
        }
      }
      .editor__panel {
        position: sticky;
        top: var(--tx-space-4);
        padding: var(--tx-space-4);
        background-color: var(--tx-color-surface-raised);
        border: var(--tx-border-width) solid var(--tx-color-border);
        border-radius: var(--tx-radius-lg);
      }
      .editor__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-block-end: var(--tx-space-3);
      }
      .editor__scope {
        margin: 2px 0 0;
        font-family: var(--tx-font-mono);
        font-size: var(--tx-text-2xs);
        letter-spacing: var(--tx-tracking-label);
        text-transform: uppercase;
        color: var(--tx-color-on-surface-muted);
      }
      .editor__head h2 {
        margin: 0;
        font-family: var(--tx-font-display);
        font-size: var(--tx-text-lg);
        font-weight: var(--tx-weight-semibold);
      }
      .presets {
        display: flex;
        gap: var(--tx-space-1);
        margin-block-end: var(--tx-space-4);
      }
      .preset {
        flex: 1;
        padding: var(--tx-space-1) var(--tx-space-2);
        font-family: var(--tx-font-mono);
        font-size: var(--tx-text-2xs);
        letter-spacing: var(--tx-tracking-label);
        text-transform: uppercase;
        color: var(--tx-color-on-surface-muted);
        background-color: var(--tx-color-surface-variant);
        border: var(--tx-border-width) solid var(--tx-color-border);
        border-radius: var(--tx-radius-sm);
        cursor: pointer;
      }
      .preset--active {
        color: var(--tx-color-accent);
        background-color: var(--tx-color-accent-subtle);
        border-color: var(--tx-color-accent-muted);
      }
      .preset:focus-visible {
        outline: var(--tx-border-width-thick) solid var(--tx-color-focus);
        outline-offset: 1px;
      }
      .fields {
        display: flex;
        flex-direction: column;
        gap: var(--tx-space-3);
      }
      .field label {
        display: flex;
        flex-direction: column;
        gap: 1px;
        margin-block-end: var(--tx-space-1);
        font-family: var(--tx-font-mono);
        font-size: var(--tx-text-2xs);
        letter-spacing: var(--tx-tracking-label);
        text-transform: uppercase;
        color: var(--tx-color-on-surface-muted);
      }
      .field__hint {
        text-transform: none;
        letter-spacing: 0;
        font-family: var(--tx-font-sans);
        font-size: var(--tx-text-2xs);
        color: var(--tx-color-on-surface-subtle);
      }
      .field__color {
        display: flex;
        align-items: center;
        gap: var(--tx-space-2);
      }
      .field__color input {
        width: 2.5rem;
        height: 2rem;
        padding: 2px;
        background: none;
        border: var(--tx-border-width) solid var(--tx-color-border-strong);
        border-radius: var(--tx-radius-sm);
        cursor: pointer;
      }
      .field__color code {
        font-family: var(--tx-font-mono);
        font-size: var(--tx-text-xs);
        color: var(--tx-color-on-surface-muted);
      }
      .field__text {
        width: 100%;
        min-height: 2rem;
        padding-inline: var(--tx-space-2);
        font-family: var(--tx-font-mono);
        font-size: var(--tx-text-xs);
        color: var(--tx-color-on-surface);
        background-color: var(--tx-color-surface);
        border: var(--tx-border-width) solid var(--tx-color-border-strong);
        border-radius: var(--tx-radius-sm);
      }
      .field__text:focus-visible,
      .field__color input:focus-visible {
        outline: var(--tx-border-width-thick) solid var(--tx-color-focus);
        outline-offset: 1px;
      }
      .preview {
        display: flex;
        flex-direction: column;
        gap: var(--tx-space-4);
      }
      .preview__row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--tx-space-3);
      }
      .preview__row--grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
      }
      .prose {
        max-width: 62ch;
        margin: 0;
        font-size: var(--tx-text-sm);
        color: var(--tx-color-on-surface-muted);
      }
      .scoped {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
        gap: var(--tx-space-4);
        width: 100%;
      }
      .scoped__half {
        display: flex;
        flex-direction: column;
        gap: var(--tx-space-2);
        padding: var(--tx-space-4);
        background-color: var(--tx-color-surface-raised);
        border: var(--tx-border-width) solid var(--tx-color-border);
        border-radius: var(--tx-radius-lg);
        align-items: flex-start;
      }
      .scoped__label {
        margin: 0;
        font-family: var(--tx-font-mono);
        font-size: var(--tx-text-2xs);
        letter-spacing: var(--tx-tracking-label);
        text-transform: uppercase;
        color: var(--tx-color-on-surface-muted);
      }
    `,
  ],
})
export class ThemingPage {
  protected readonly theme = inject(ThemeService);
  protected readonly tokens = EDITABLE_TOKENS;
  protected readonly presets = PRESETS;

  protected readonly ref = signal('CB-1042');
  protected readonly owner = signal<string | null>('ops');
  protected readonly checked = signal(true);
  protected readonly toggled = signal(true);

  protected readonly owners: readonly TxSelectOption<string>[] = [
    { value: 'ops', label: 'Operations' },
    { value: 'eng', label: 'Engineering' },
  ];

  protected readonly rows: readonly PreviewRow[] = [
    { ref: 'CB-1042', item: 'Shielded twisted pair', qty: 1840 },
    { ref: 'EN-0110', item: 'Wall enclosure', qty: 38 },
    { ref: 'SN-8100', item: 'Proximity sensor', qty: 210 },
  ];

  protected readonly columns: readonly TxTableColumn<PreviewRow>[] = [
    { key: 'ref', header: 'Ref', variant: 'data', sortable: true, width: '7rem' },
    { key: 'item', header: 'Item', sortable: true },
    { key: 'qty', header: 'Qty', variant: 'numeric', align: 'end', sortable: true, width: '6rem' },
  ];

  protected readonly activePreset = computed(() => {
    const current = this.theme.overrides();
    const match = this.presets.find(
      (preset) =>
        Object.keys(preset.light).length > 0 &&
        Object.entries(preset.light).every(([key, value]) => current[key] === value),
    );
    // "Shipped" matches vacuously, so only claim it when nothing is set.
    if (!Object.values(current).some(Boolean)) return 'Shipped';
    return match ? match.name : null;
  });

  /**
   * Values shown in the editor, for whichever theme is active.
   *
   * Falls back to the token's *computed* value rather than a hardcoded initial,
   * so the fields show the real shipped value in dark as well as light.
   */
  protected readonly fieldValues = computed<Record<string, string>>(() => {
    const map = this.theme.mode() === 'dark' ? this.theme.darkOverrides() : this.theme.overrides();
    const root = getComputedStyle(document.documentElement);
    const out: Record<string, string> = {};
    for (const token of this.tokens) {
      out[token.name] = map[token.name] || root.getPropertyValue(token.name).trim() || token.initial;
    }
    return out;
  });

  protected valueOf(name: string, fallback: string): string {
    return this.fieldValues()[name] || fallback;
  }

  /**
   * Edits land in the scope of the theme currently on screen.
   *
   * Writing everything to `:root` meant an edit made in dark mode silently did
   * nothing: `:root[data-theme='dark']` is more specific and kept winning.
   */
  protected set(name: string, value: string): void {
    if (this.theme.mode() === 'dark') this.theme.setDarkOverride(name, value);
    else this.theme.setOverride(name, value);
  }

  protected applyPreset(name: string): void {
    const preset = this.presets.find((p) => p.name === name);
    if (!preset) return;
    this.theme.resetOverrides();
    for (const [token, value] of Object.entries(preset.light)) {
      this.theme.setOverride(token, value);
    }
    for (const [token, value] of Object.entries(preset.dark)) {
      this.theme.setDarkOverride(token, value);
    }
  }

  protected readonly cssSnippet = `@import '@tx-angular-design-system/core/styles/theme.css';

:root {
  --tx-color-accent: #0d47a1;
  --tx-color-on-accent: #ffffff;
}

/* The accent is theme-dependent — pick a lighter step for dark. */
:root[data-theme='dark'],
.tx-theme-dark {
  --tx-color-accent: #82a3d8;
  --tx-color-on-accent: #10202e;
}`;

  protected readonly scopeSnippet = `<!-- Themes only what is inside it -->
<section class="tx-theme-dark">
  <tx-button variant="filled">Save</tx-button>
</section>

<!-- Or any token, on any container -->
<section style="--tx-color-accent: #a8332a">
  <tx-button variant="filled">Delete</tx-button>
</section>`;
}
