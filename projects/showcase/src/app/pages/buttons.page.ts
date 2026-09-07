import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TxButton, TxIcon, TxIconRegistry } from '@tx-angular-design-system/core';
import { ApiRow, DemoApi, DemoExample, DemoGuidance, DemoKeys, DemoPage } from '../shared/demo';

@Component({
  standalone: true,
  imports: [DemoPage, DemoExample, DemoApi, DemoKeys, DemoGuidance, TxButton, TxIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <demo-page
      heading="Buttons & icons"
      lede="tx-button renders a real button element, so focus, activation and form participation
            come from the platform. tx-icon draws inline SVG from a registry."
    >
      <demo-example heading="Variants" [code]="variantCode">
        <tx-button variant="filled">Filled</tx-button>
        <tx-button variant="tonal">Tonal</tx-button>
        <tx-button variant="outlined">Outlined</tx-button>
        <tx-button variant="text">Text</tx-button>
        <tx-button variant="danger">Danger</tx-button>
      </demo-example>

      <demo-example heading="Sizes" note="Sizes track the density scale, so a compact page gets compact buttons.">
        <tx-button size="sm">Small</tx-button>
        <tx-button size="md">Medium</tx-button>
        <tx-button size="lg">Large</tx-button>
      </demo-example>

      <demo-example heading="With icons" [code]="iconCode">
        <tx-button variant="filled">
          <tx-icon slot="leading" name="check" size="sm" />
          Approve
        </tx-button>
        <tx-button variant="outlined">
          Export
          <tx-icon slot="trailing" name="download" size="sm" />
        </tx-button>
        <tx-button variant="text" ariaLabel="Delete">
          <tx-icon slot="leading" name="trash" size="sm" />
        </tx-button>
      </demo-example>

      <demo-example
        heading="Loading and disabled"
        note="A loading button disables itself and reports aria-busy, so a double submit is not possible."
        [code]="loadingCode"
      >
        <tx-button variant="filled" [loading]="saving()" (activated)="save()">
          {{ saving() ? 'Saving' : 'Save changes' }}
        </tx-button>
        <tx-button variant="filled" [disabled]="true">Disabled</tx-button>
        <tx-button variant="outlined" [disabled]="true">Disabled</tx-button>
      </demo-example>

      <demo-example heading="Icon set" note="Registered names. Add your own with provideTxIcons()." column>
        <ul class="icons">
          @for (name of iconNames; track name) {
            <li>
              <tx-icon [name]="name" size="md" />
              <code>{{ name }}</code>
            </li>
          }
        </ul>
      </demo-example>

      <demo-example
        heading="Registering your own"
        note="Give it a path and use the name. The full definition is only for solid glyphs or a different grid."
        [code]="registerCode"
        column
      >
        <ul class="icons">
          @for (name of customNames; track name) {
            <li>
              <tx-icon [name]="name" size="md" />
              <code>{{ name }}</code>
            </li>
          }
        </ul>
        <p class="prose">
          Icons are stored as path geometry, never markup, so nothing passes through
          <code>innerHTML</code> — a registered icon cannot carry script. An unknown name renders
          nothing rather than throwing. Register a name that already exists and yours replaces it,
          which is how you swap a built-in for your own drawing.
        </p>
      </demo-example>

      <demo-example
        heading="A one-off, without registering anything"
        note="path draws geometry directly and wins over name."
        [code]="inlineCode"
        column
      >
        <ul class="icons">
          <li>
            <tx-icon [path]="starPath" size="md" />
            <code>path</code>
          </li>
          <li>
            <tx-icon [path]="starPath" size="md" filled />
            <code>filled</code>
          </li>
          <li>
            <tx-icon [path]="crossPaths" size="md" />
            <code>path[]</code>
          </li>
          <li>
            <tx-icon [path]="tinyPath" viewBox="0 0 16 16" size="md" />
            <code>viewBox</code>
          </li>
        </ul>
        <p class="prose">
          This is the escape hatch, not the habit. An icon used on more than one screen belongs in
          <code>provideTxIcons</code>, where it has a name, can be swapped in one place, and turns up
          in <code>registry.names()</code> — which is what draws both galleries above.
        </p>
      </demo-example>

      <demo-api heading="tx-button" [rows]="buttonApi" />
      <demo-api heading="tx-icon" [rows]="iconApi" />
      <demo-keys [rows]="keys" />
      <demo-guidance [dos]="dos" [donts]="donts" />
    </demo-page>
  `,
  styles: [
    `
      .icons {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
        gap: var(--tx-space-2);
        width: 100%;
      }
      .icons li {
        display: flex;
        align-items: center;
        gap: var(--tx-space-2);
        padding: var(--tx-space-2);
        background-color: var(--tx-color-surface-raised);
        border: var(--tx-border-width) solid var(--tx-color-border);
        border-radius: var(--tx-radius-md);
      }
      .icons code {
        font-family: var(--tx-font-mono);
        font-size: var(--tx-text-2xs);
        color: var(--tx-color-on-surface-muted);
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .prose {
        max-width: 62ch;
        margin: 0;
        font-size: var(--tx-text-sm);
        color: var(--tx-color-on-surface-muted);
      }
      code {
        font-family: var(--tx-font-mono);
        font-size: 0.9em;
      }
    `,
  ],
})
export class ButtonsPage {
  private readonly registry = inject(TxIconRegistry);

  protected readonly saving = signal(false);
  /** The set the library ships. */
  protected readonly iconNames = this.registry.names().filter((n) => !n.startsWith('demo-'));
  /** Registered by this showcase's own providers — see app.config.ts. */
  protected readonly customNames = this.registry.names().filter((n) => n.startsWith('demo-'));

  protected readonly starPath = 'M12 2l3 7h7l-6 4 2 7-6-4-6 4 2-7-6-4h7z';
  protected readonly crossPaths = ['M4 4l16 16', 'M20 4L4 20'];
  protected readonly tinyPath = 'M8 1l2 5 5 2-5 2-2 5-2-5-5-2 5-2z';

  protected save(): void {
    this.saving.set(true);
    setTimeout(() => this.saving.set(false), 1200);
  }

  protected readonly variantCode = `<tx-button variant="filled">Filled</tx-button>
<tx-button variant="tonal">Tonal</tx-button>
<tx-button variant="outlined">Outlined</tx-button>
<tx-button variant="text">Text</tx-button>
<tx-button variant="danger">Danger</tx-button>`;

  protected readonly iconCode = `<tx-button variant="filled">
  <tx-icon slot="leading" name="check" size="sm" />
  Approve
</tx-button>

<!-- Icon-only buttons need a name -->
<tx-button variant="text" ariaLabel="Delete">
  <tx-icon slot="leading" name="trash" size="sm" />
</tx-button>`;

  protected readonly loadingCode = `<tx-button variant="filled" [loading]="saving()" (activated)="save()">
  {{ saving() ? 'Saving' : 'Save changes' }}
</tx-button>`;

  protected readonly registerCode = `import { provideTxIcons } from '@tx-angular-design-system/core';

bootstrapApplication(App, {
  providers: [
    provideTxIcons({
      // One path — the common case.
      rocket: 'M12 2c3 3 4 7 4 10l-4 4-4-4c0-3 1-7 4-10z',
      // Several, when the glyph needs them.
      crosshair: ['M12 3v18', 'M3 12h18', 'M12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10z'],
      // The long form, for a solid glyph or a different grid.
      seal: { paths: ['M8 1l2 5 5 2-5 2-2 5-2-5-5-2 5-2z'], viewBox: '0 0 16 16', stroked: false },
      // A name that already exists replaces the built-in.
      check: 'M4 12l5 5L20 6',
    }),
  ],
});

<tx-icon name="rocket" />`;

  protected readonly inlineCode = `<!-- One path, nothing registered -->
<tx-icon path="M12 2l3 7h7l-6 4 2 7-6-4-6 4 2-7-6-4h7z" />

<!-- Several, a solid glyph, or a different grid -->
<tx-icon [path]="['M4 4l16 16', 'M20 4L4 20']" />
<tx-icon [path]="star" filled />
<tx-icon [path]="mark" viewBox="0 0 16 16" />`;

  protected readonly buttonApi: readonly ApiRow[] = [
    { name: 'variant', type: "'filled' | 'tonal' | 'outlined' | 'text' | 'danger'", def: "'filled'", description: 'Visual weight. One filled button per region is usually enough.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", def: "'md'", description: 'Height and padding, relative to the density scale.' },
    { name: 'type', type: "'button' | 'submit' | 'reset'", def: "'button'", description: 'Native button type.' },
    { name: 'disabled', type: 'boolean', def: 'false', description: 'Blocks activation and removes it from the tab order.' },
    { name: 'loading', type: 'boolean', def: 'false', description: 'Shows a spinner, disables the button and sets aria-busy.' },
    { name: 'fullWidth', type: 'boolean', def: 'false', description: 'Stretches to the container width.' },
    { name: 'ariaLabel', type: 'string', def: "''", description: 'Required when the button contains only an icon.' },
    { name: 'activated', type: 'output<MouseEvent>', description: 'Fires on activation. Never fires while disabled or loading.' },
  ];

  protected readonly iconApi: readonly ApiRow[] = [
    { name: 'name', type: 'string', def: "''", description: 'Registered icon name. Unknown names render nothing rather than throwing.' },
    { name: 'path', type: 'string | readonly string[] | TxIconDefinition', def: "''", description: 'Geometry drawn directly, without registering anything. Wins over name.' },
    { name: 'viewBox', type: 'string', def: "''", description: "Overrides the icon's own grid. Defaults to the 24-unit one." },
    { name: 'filled', type: 'boolean', def: 'false', description: 'Solid glyph rather than a stroked one — the inverse of the definition’s stroked.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", def: "'md'", description: '16, 20 or 24 px.' },
    { name: 'label', type: 'string', def: "''", description: 'Accessible name. Omit for decorative icons — they are aria-hidden by default.' },
  ];

  protected readonly keys = [
    { keys: 'Tab', action: 'Move focus to the button' },
    { keys: 'Enter', action: 'Activate' },
    { keys: 'Space', action: 'Activate' },
  ];

  protected readonly dos = [
    'Use one filled button per region — the primary action.',
    'Give icon-only buttons an ariaLabel.',
    'Use the loading state for anything that takes more than a moment.',
    'Use the danger variant for destructive actions, and confirm them.',
  ];

  protected readonly donts = [
    'Do not put several filled buttons side by side; nothing reads as primary.',
    'Do not use a button where a link belongs — navigation should be an anchor.',
    'Do not disable a button without telling the user what is missing.',
    'Do not rely on colour alone to signal a destructive action.',
  ];
}
