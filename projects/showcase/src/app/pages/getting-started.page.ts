import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DemoExample, DemoPage } from '../shared/demo';

@Component({
  standalone: true,
  imports: [DemoPage, DemoExample],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <demo-page
      eyebrow="Start here"
      heading="Getting started"
      lede="One command installs the package, its peers, Tailwind if you want it, and wires the
            theme into your global stylesheet in the order the cascade needs."
    >
      <demo-example heading="Install" [code]="install" column>
        <p class="prose">
          <code>ng add</code> reads your Angular version and installs matching peers rather than
          hardcoded ones, registers the <code>$localize</code> polyfill the built-in strings need,
          and creates an overrides stub. Run it twice and nothing changes.
        </p>
      </demo-example>

      <demo-example heading="Manual setup" [code]="manual" column>
        <p class="prose">
          If you would rather do it by hand, three things matter: the import order below, the
          <code>&#64;angular/localize/init</code> polyfill in your build, and adding
          <code>&#64;tailwindcss/postcss</code> to your PostCSS config if you use Tailwind.
        </p>
      </demo-example>

      <demo-example heading="Use a component" [code]="usage" column>
        <p class="prose">
          Every component is standalone — import the class and put it in a component's
          <code>imports</code>. There is no module to register.
        </p>
      </demo-example>

      <demo-example heading="Set application defaults" [code]="provide" column>
        <p class="prose">
          <code>provideTxDesignSystem</code> sets the defaults components fall back to: density,
          page sizes, how many chips a multi-select shows before collapsing, and the option count
          past which a select grows a filter field.
        </p>
      </demo-example>

      <demo-example heading="Requirements" column>
        <div class="reqs">
          <dl>
            <div><dt>Angular</dt><dd>22</dd></div>
            <div><dt>TypeScript</dt><dd>~6.0 — <strong>not</strong> 7.x</dd></div>
            <div><dt>Peers</dt><dd>&#64;angular/aria, &#64;angular/cdk, &#64;angular/localize</dd></div>
            <div><dt>Browsers</dt><dd>Chrome/Edge 105+, Firefox 121+, Safari 15.4+</dd></div>
          </dl>
          <p class="note">
            The Angular compiler rejects TypeScript 7. The browser floor is set by
            <code>:has()</code>, which the field components use for focus and hover states.
          </p>
        </div>
      </demo-example>
    </demo-page>
  `,
  styles: [
    `
      .prose {
        max-width: 62ch;
        margin: 0;
        color: var(--tx-color-on-surface-muted);
        font-size: var(--tx-text-sm);
        line-height: 1.7;
      }
      code {
        font-family: var(--tx-font-mono);
        font-size: 0.9em;
        padding: 1px 4px;
        color: var(--tx-color-on-surface);
        background-color: var(--tx-color-surface-variant);
        border-radius: var(--tx-radius-sm);
      }
      .reqs {
        display: flex;
        flex-direction: column;
        gap: var(--tx-space-3);
      }
      .reqs dl {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: var(--tx-space-2) var(--tx-space-5);
        margin: 0;
        font-size: var(--tx-text-sm);
      }
      .reqs dl > div {
        display: contents;
      }
      .reqs dt {
        font-family: var(--tx-font-mono);
        font-size: var(--tx-text-2xs);
        letter-spacing: var(--tx-tracking-label);
        text-transform: uppercase;
        color: var(--tx-color-on-surface-muted);
        white-space: nowrap;
      }
      .reqs dd {
        margin: 0;
      }
      .note {
        max-width: 62ch;
        margin: 0;
        font-size: var(--tx-text-xs);
        color: var(--tx-color-on-surface-muted);
      }
    `,
  ],
})
export class GettingStartedPage {
  protected readonly install = `ng add @tx-angular-design-system/core

# It will ask for:
#   a brand seed colour      -> written into src/styles/_tx-overrides.css
#   light / dark / both      -> sets color-scheme
#   bundled or system fonts  -> theme.css or tokens.css
#   Tailwind v4              -> adds the plugin and the token bridge`;

  protected readonly manual = `npm install @tx-angular-design-system/core @angular/aria @angular/cdk @angular/localize

/* src/styles.css — order matters */
@import 'tailwindcss';
@import '@tx-angular-design-system/core/styles/theme.css';
@import '@tx-angular-design-system/core/styles/tailwind.css';
@import './styles/_tx-overrides.css';

// angular.json -> projects.<app>.architect.build.options
"polyfills": ["@angular/localize/init"]`;

  protected readonly usage = `import { TxButton, TxSelect } from '@tx-angular-design-system/core';

@Component({
  standalone: true,
  imports: [TxButton, TxSelect],
  template: \`
    <tx-select label="Owner" [options]="owners()" [(value)]="owner" clearable />
    <tx-button variant="filled" (activated)="save()">Save</tx-button>
  \`,
})
export class EditorPage {}`;

  protected readonly provide = `import { provideTxDesignSystem } from '@tx-angular-design-system/core';

bootstrapApplication(App, {
  providers: [
    provideTxDesignSystem({
      density: 'compact',
      pageSize: 25,
      pageSizeOptions: [25, 50, 100],
      maxVisibleChips: 2,
      filterThreshold: 8,
    }),
  ],
});`;
}
