import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TxButton, TxCard, TxIcon } from '@tx-angular-design-system/core';
import { DemoPage } from '../shared/demo';

interface Highlight {
  readonly icon: string;
  readonly title: string;
  readonly body: string;
}

const HIGHLIGHTS: readonly Highlight[] = [
  {
    icon: 'check',
    title: 'Accessible by construction',
    body: 'Interaction comes from Angular Aria and native elements, so focus, typeahead and ARIA are the framework’s job, not ours. Every shipped colour pair is verified against WCAG 2.2 AA.',
  },
  {
    icon: 'filter',
    title: 'One set of tokens',
    body: 'Colour, type, spacing, radius, elevation, density and motion are CSS custom properties. Override one and it cascades to every component and Tailwind utility, at runtime.',
  },
  {
    icon: 'download',
    title: 'Works offline',
    body: 'Typefaces are self-hosted inside the package — about 108 KB, all OFL-1.1. No CDN reference anywhere, so air-gapped builds behave the same as connected ones.',
  },
  {
    icon: 'edit',
    title: 'Signals throughout',
    body: 'input(), model(), computed() and OnPush everywhere, zoneless-compatible. Form controls satisfy both ControlValueAccessor and the Signal Forms contract.',
  },
];

const STATS: readonly { value: string; label: string }[] = [
  { value: '20', label: 'Components' },
  { value: '121', label: 'Unit tests' },
  { value: '108 KB', label: 'Bundled fonts' },
  { value: 'AA', label: 'WCAG 2.2' },
];

@Component({
  standalone: true,
  imports: [DemoPage, TxCard, TxButton, TxIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <demo-page
      eyebrow="@tx-angular-design-system/core"
      heading="An Angular design system that gets out of the way"
      lede="Accessible, signal-based components built on Angular Aria and the CDK, themed entirely
            through CSS custom properties. No Angular Material dependency."
    >
      <dl class="stats">
        @for (stat of stats; track stat.label) {
          <div class="stat">
            <dt>{{ stat.label }}</dt>
            <dd>{{ stat.value }}</dd>
          </div>
        }
      </dl>

      <div class="grid">
        @for (item of highlights; track item.title) {
          <tx-card variant="outlined">
            <span slot="title">{{ item.title }}</span>
            <div class="card-body">
              <tx-icon class="card-icon" [name]="item.icon" size="lg" />
              <p>{{ item.body }}</p>
            </div>
          </tx-card>
        }
      </div>

      <tx-card variant="filled">
        <span slot="title">See it under load</span>
        <span slot="subtitle">The composition page is the real acceptance test</span>
        <p class="cta-body">
          Isolated demos hide awkward APIs. The composition page builds a full working screen —
          filters, a sortable paginated table and a multi-section form — from library components
          only, which is where gaps actually show up.
        </p>
        <div slot="actions">
          <tx-button variant="filled" (activated)="go('catalogue')">
            Open the composition page
            <tx-icon slot="trailing" name="chevron-right" size="sm" />
          </tx-button>
          <tx-button variant="text" (activated)="go('getting-started')">Install it</tx-button>
        </div>
      </tx-card>
    </demo-page>
  `,
  styles: [
    `
      .stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
        gap: 1px;
        margin: 0;
        background-color: var(--tx-color-border);
        border: var(--tx-border-width) solid var(--tx-color-border);
        border-radius: var(--tx-radius-lg);
        overflow: hidden;
      }
      .stat {
        padding: var(--tx-space-4) var(--tx-space-5);
        background-color: var(--tx-color-surface-raised);
      }
      .stat dt {
        font-family: var(--tx-font-mono);
        font-size: var(--tx-text-2xs);
        font-weight: var(--tx-weight-medium);
        letter-spacing: var(--tx-tracking-label);
        text-transform: uppercase;
        color: var(--tx-color-on-surface-muted);
      }
      .stat dd {
        margin: var(--tx-space-1) 0 0;
        font-family: var(--tx-font-display);
        font-size: var(--tx-text-2xl);
        font-weight: var(--tx-weight-bold);
        letter-spacing: var(--tx-tracking-tight);
        font-variant-numeric: tabular-nums;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
        gap: var(--tx-space-4);
      }
      .card-body {
        display: flex;
        gap: var(--tx-space-3);
      }
      .card-body p {
        margin: 0;
        font-size: var(--tx-text-sm);
        color: var(--tx-color-on-surface-muted);
      }
      .card-icon {
        flex: none;
        color: var(--tx-color-accent);
      }
      .cta-body {
        max-width: 62ch;
        margin: 0;
        color: var(--tx-color-on-surface-muted);
      }
    `,
  ],
})
export class OverviewPage {
  private readonly router = inject(Router);
  protected readonly highlights = HIGHLIGHTS;
  protected readonly stats = STATS;

  protected go(path: string): void {
    void this.router.navigate([path]);
  }
}
