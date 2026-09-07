import { ChangeDetectionStrategy, Component, booleanAttribute, input, signal } from '@angular/core';
import { TxButton, TxIcon } from '@tx-angular-design-system/core';

/**
 * Page frame for a documentation page: title, standfirst, and a slot for the
 * sections beneath.
 */
@Component({
  selector: 'demo-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-head">
      <p class="page-eyebrow">{{ eyebrow() }}</p>
      <h1 class="page-title">{{ heading() }}</h1>
      @if (lede()) {
        <p class="page-lede">{{ lede() }}</p>
      }
    </header>
    <div class="page-body"><ng-content /></div>
  `,
  styles: [
    `
      :host {
        display: block;
        max-width: 64rem;
      }
      .page-head {
        padding-block-end: var(--tx-space-5);
        margin-block-end: var(--tx-space-6);
        border-block-end: var(--tx-border-width-thick) solid var(--tx-color-on-surface);
      }
      .page-eyebrow {
        margin: 0;
        font-family: var(--tx-font-mono);
        font-size: var(--tx-text-2xs);
        font-weight: var(--tx-weight-medium);
        letter-spacing: var(--tx-tracking-label);
        text-transform: uppercase;
        color: var(--tx-color-on-surface-muted);
      }
      .page-title {
        margin: var(--tx-space-2) 0 0;
        font-family: var(--tx-font-display);
        font-size: var(--tx-text-3xl);
        font-weight: var(--tx-weight-bold);
        line-height: var(--tx-leading-3xl);
        letter-spacing: var(--tx-tracking-tight);
        text-wrap: balance;
      }
      .page-lede {
        max-width: 62ch;
        margin: var(--tx-space-3) 0 0;
        font-size: var(--tx-text-lg);
        line-height: var(--tx-leading-lg);
        color: var(--tx-color-on-surface-muted);
      }
      .page-body {
        display: flex;
        flex-direction: column;
        gap: var(--tx-space-8);
      }
    `,
  ],
})
export class DemoPage {
  readonly eyebrow = input('Component');
  readonly heading = input.required<string>();
  readonly lede = input<string>('');
}

/**
 * One documented example: a live demo above the source that produced it.
 *
 * The snippet is passed in rather than extracted from the DOM, because what a
 * reader needs is the code they would write, not the markup Angular rendered.
 */
@Component({
  selector: 'demo-example',
  standalone: true,
  imports: [TxButton, TxIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="example">
      <div class="example__head">
        <div>
          <h2 class="example__title">{{ heading() }}</h2>
          @if (note()) {
            <p class="example__note">{{ note() }}</p>
          }
        </div>
        @if (code()) {
          <tx-button variant="text" size="sm" (activated)="copy()">
            <tx-icon slot="leading" [name]="copied() ? 'check' : 'edit'" size="sm" />
            {{ copied() ? 'Copied' : 'Copy' }}
          </tx-button>
        }
      </div>

      <div class="example__stage" [class.example__stage--column]="column()">
        <ng-content />
      </div>

      @if (code()) {
        <pre class="example__code"><code>{{ code() }}</code></pre>
      }
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .example {
        border: var(--tx-border-width) solid var(--tx-color-border);
        border-radius: var(--tx-radius-lg);
        background-color: var(--tx-color-surface-raised);
        overflow: hidden;
      }
      .example__head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--tx-space-3);
        padding: var(--tx-space-4) var(--tx-space-5);
        border-block-end: var(--tx-border-width) solid var(--tx-color-border);
      }
      .example__title {
        margin: 0;
        font-family: var(--tx-font-display);
        font-size: var(--tx-text-lg);
        font-weight: var(--tx-weight-semibold);
        letter-spacing: var(--tx-tracking-tight);
      }
      .example__note {
        max-width: 60ch;
        margin: var(--tx-space-1) 0 0;
        font-size: var(--tx-text-sm);
        color: var(--tx-color-on-surface-muted);
      }
      .example__stage {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        gap: var(--tx-space-4);
        padding: var(--tx-space-5);
        background-color: var(--tx-color-canvas);
      }
      .example__stage--column {
        flex-direction: column;
        /* nowrap is load-bearing: a wrapping column container sizes each
           column to its max-content, so a wide table would push the page out
           instead of scrolling inside itself. */
        flex-wrap: nowrap;
        align-items: stretch;
      }
      .example__stage > * {
        max-width: 100%;
      }
      .example__code {
        margin: 0;
        padding: var(--tx-space-4) var(--tx-space-5);
        overflow-x: auto;
        font-family: var(--tx-font-mono);
        font-size: var(--tx-text-xs);
        line-height: 1.7;
        color: var(--tx-color-on-surface-muted);
        border-block-start: var(--tx-border-width) solid var(--tx-color-border);
      }
    `,
  ],
})
export class DemoExample {
  readonly heading = input.required<string>();
  readonly note = input<string>('');
  readonly code = input<string>('');
  /** Stacks the stage vertically for full-width demos such as tables. */
  readonly column = input(false, { transform: booleanAttribute });

  protected readonly copied = signal(false);

  protected async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.code());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1600);
    } catch {
      // Clipboard access can be denied; the snippet is selectable either way.
    }
  }
}

export interface ApiRow {
  readonly name: string;
  readonly type: string;
  readonly def?: string;
  readonly description: string;
}

/** Inputs, outputs and their defaults, rendered as a reference table. */
@Component({
  selector: 'demo-api',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="api">
      <h2 class="api__title">{{ heading() }}</h2>
      <div class="api__scroll">
        <table class="api__table">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Type</th>
              <th scope="col">Default</th>
              <th scope="col">Description</th>
            </tr>
          </thead>
          <tbody>
            @for (row of rows(); track row.name) {
              <tr>
                <td class="api__name">{{ row.name }}</td>
                <td class="api__type">{{ row.type }}</td>
                <td class="api__def">{{ row.def ?? '—' }}</td>
                <td>{{ row.description }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .api__title {
        margin: 0 0 var(--tx-space-3);
        font-family: var(--tx-font-display);
        font-size: var(--tx-text-lg);
        font-weight: var(--tx-weight-semibold);
        letter-spacing: var(--tx-tracking-tight);
      }
      .api__scroll {
        overflow-x: auto;
        border: var(--tx-border-width) solid var(--tx-color-border);
        border-radius: var(--tx-radius-lg);
        background-color: var(--tx-color-surface-raised);
      }
      .api__table {
        width: 100%;
        min-width: 44rem;
        border-collapse: collapse;
        font-size: var(--tx-text-sm);
        text-align: start;
      }
      .api__table th {
        padding: var(--tx-space-3) var(--tx-space-4);
        text-align: start;
        font-family: var(--tx-font-mono);
        font-size: var(--tx-text-2xs);
        font-weight: var(--tx-weight-semibold);
        letter-spacing: var(--tx-tracking-label);
        text-transform: uppercase;
        color: var(--tx-color-on-surface-muted);
        background-color: var(--tx-color-surface-variant);
        border-block-end: var(--tx-border-width) solid var(--tx-color-border);
        white-space: nowrap;
      }
      .api__table td {
        padding: var(--tx-space-3) var(--tx-space-4);
        vertical-align: top;
        border-block-end: var(--tx-border-width) solid var(--tx-color-border);
      }
      .api__table tbody tr:last-child td {
        border-block-end: 0;
      }
      .api__name,
      .api__type,
      .api__def {
        font-family: var(--tx-font-mono);
        font-size: var(--tx-text-xs);
        white-space: nowrap;
      }
      .api__name {
        color: var(--tx-color-accent);
        font-weight: var(--tx-weight-semibold);
      }
      .api__type {
        color: var(--tx-color-on-surface-muted);
      }
      .api__def {
        color: var(--tx-color-on-surface-subtle);
      }
    `,
  ],
})
export class DemoApi {
  readonly heading = input('API');
  readonly rows = input.required<readonly ApiRow[]>();
}

/** Keyboard reference, rendered from a map of key → action. */
@Component({
  selector: 'demo-keys',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="keys">
      <h2 class="keys__title">Keyboard</h2>
      <dl class="keys__list">
        @for (row of rows(); track row.keys) {
          <div class="keys__row">
            <dt><kbd>{{ row.keys }}</kbd></dt>
            <dd>{{ row.action }}</dd>
          </div>
        }
      </dl>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .keys__title {
        margin: 0 0 var(--tx-space-3);
        font-family: var(--tx-font-display);
        font-size: var(--tx-text-lg);
        font-weight: var(--tx-weight-semibold);
        letter-spacing: var(--tx-tracking-tight);
      }
      .keys__list {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: var(--tx-space-2) var(--tx-space-5);
        margin: 0;
        padding: var(--tx-space-4) var(--tx-space-5);
        border: var(--tx-border-width) solid var(--tx-color-border);
        border-radius: var(--tx-radius-lg);
        background-color: var(--tx-color-surface-raised);
        font-size: var(--tx-text-sm);
      }
      .keys__row {
        display: contents;
      }
      .keys__list dt {
        white-space: nowrap;
      }
      .keys__list dd {
        margin: 0;
        color: var(--tx-color-on-surface-muted);
      }
      kbd {
        display: inline-block;
        padding: 1px var(--tx-space-2);
        font-family: var(--tx-font-mono);
        font-size: var(--tx-text-xs);
        color: var(--tx-color-on-surface);
        background-color: var(--tx-color-surface-variant);
        border: var(--tx-border-width) solid var(--tx-color-border);
        border-radius: var(--tx-radius-sm);
      }
    `,
  ],
})
export class DemoKeys {
  readonly rows = input.required<readonly { keys: string; action: string }[]>();
}

/** Side-by-side guidance. */
@Component({
  selector: 'demo-guidance',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="guide">
      <div class="guide__col guide__col--do">
        <h3>Do</h3>
        <ul>
          @for (item of dos(); track item) {
            <li>{{ item }}</li>
          }
        </ul>
      </div>
      <div class="guide__col guide__col--dont">
        <h3>Don't</h3>
        <ul>
          @for (item of donts(); track item) {
            <li>{{ item }}</li>
          }
        </ul>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .guide {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(18rem, 100%), 1fr));
        gap: var(--tx-space-4);
      }
      .guide__col {
        padding: var(--tx-space-4) var(--tx-space-5);
        border: var(--tx-border-width) solid var(--tx-color-border);
        border-inline-start-width: 3px;
        border-radius: var(--tx-radius-lg);
        background-color: var(--tx-color-surface-raised);
      }
      .guide__col--do {
        border-inline-start-color: var(--tx-color-success);
      }
      .guide__col--dont {
        border-inline-start-color: var(--tx-color-danger);
      }
      .guide__col h3 {
        margin: 0 0 var(--tx-space-2);
        font-family: var(--tx-font-mono);
        font-size: var(--tx-text-2xs);
        font-weight: var(--tx-weight-semibold);
        letter-spacing: var(--tx-tracking-label);
        text-transform: uppercase;
      }
      .guide__col--do h3 {
        color: var(--tx-color-success);
      }
      .guide__col--dont h3 {
        color: var(--tx-color-danger);
      }
      .guide__col ul {
        margin: 0;
        padding-inline-start: var(--tx-space-4);
        display: flex;
        flex-direction: column;
        gap: var(--tx-space-2);
        font-size: var(--tx-text-sm);
        color: var(--tx-color-on-surface-muted);
      }
    `,
  ],
})
export class DemoGuidance {
  readonly dos = input.required<readonly string[]>();
  readonly donts = input.required<readonly string[]>();
}
