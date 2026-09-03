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

      <demo-example heading="Registering icons" [code]="registerCode" column>
        <p class="prose">
          Icons are stored as path geometry, never markup, so nothing passes through
          <code>innerHTML</code> — a registered icon cannot carry script. An unknown name renders
          nothing rather than throwing.
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
  protected readonly iconNames = this.registry.names();

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
      rocket: { paths: ['M12 2c3 3 4 7 4 10l-4 4-4-4c0-3 1-7 4-10z'] },
    }),
  ],
});`;

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
    { name: 'name', type: 'string', description: 'Registered icon name. Unknown names render nothing.' },
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
