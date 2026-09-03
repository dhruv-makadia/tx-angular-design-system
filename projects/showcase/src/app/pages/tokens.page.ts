import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DemoPage } from '../shared/demo';

const RAMP = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'] as const;

const SEMANTIC: readonly { token: string; role: string }[] = [
  { token: '--tx-color-canvas', role: 'Page ground' },
  { token: '--tx-color-surface', role: 'Panels and rails' },
  { token: '--tx-color-surface-variant', role: 'Table headers, wells' },
  { token: '--tx-color-surface-raised', role: 'Cards, overlays' },
  { token: '--tx-color-on-surface', role: 'Body text' },
  { token: '--tx-color-on-surface-muted', role: 'Secondary text' },
  { token: '--tx-color-on-surface-subtle', role: 'Placeholders' },
  { token: '--tx-color-border', role: 'Decorative hairlines' },
  { token: '--tx-color-border-strong', role: 'Control boundaries — 3:1' },
  { token: '--tx-color-accent', role: 'Primary action' },
  { token: '--tx-color-focus', role: 'Focus indicator' },
  { token: '--tx-color-success', role: 'Positive status' },
  { token: '--tx-color-warning', role: 'Caution status' },
  { token: '--tx-color-danger', role: 'Error status' },
  { token: '--tx-color-info', role: 'Neutral status' },
];

const TYPE: readonly { token: string; px: string }[] = [
  { token: '--tx-text-2xs', px: '11px' },
  { token: '--tx-text-xs', px: '12px' },
  { token: '--tx-text-sm', px: '13px' },
  { token: '--tx-text-md', px: '14px' },
  { token: '--tx-text-lg', px: '17.5px' },
  { token: '--tx-text-xl', px: '22px' },
  { token: '--tx-text-2xl', px: '27px' },
  { token: '--tx-text-3xl', px: '34px' },
  { token: '--tx-text-4xl', px: '43px' },
];

const SPACE = ['1', '2', '3', '4', '5', '6', '8', '10', '12', '16'] as const;
const RADIUS = ['sm', 'md', 'lg', 'xl', 'full'] as const;
const ELEVATION = ['1', '2', '3', '4'] as const;

@Component({
  standalone: true,
  imports: [DemoPage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <demo-page
      eyebrow="Foundations"
      heading="Tokens"
      lede="Every value the components use is a CSS custom property. Everything on this page is
            public API: redeclare any of it after the theme import and the whole system follows."
    >
      <section>
        <h2 class="h">Colour ramps</h2>
        <p class="p">
          Generated in OKLCH so perceived lightness steps evenly. Components never reference these
          directly — they go through the semantic tokens below, which is what makes retheming a
          one-line change.
        </p>

        @for (family of ['primary', 'neutral']; track family) {
          <div class="ramp">
            <p class="ramp__name">{{ family }}</p>
            <div class="ramp__row">
              @for (step of ramp; track step) {
                <div class="swatch">
                  <span
                    class="swatch__chip"
                    [style.background]="'var(--tx-color-' + family + '-' + step + ')'"
                  ></span>
                  <span class="swatch__step">{{ step }}</span>
                </div>
              }
            </div>
          </div>
        }
      </section>

      <section>
        <h2 class="h">Semantic colour</h2>
        <p class="p">
          Two border tokens, not one: WCAG 2.2 requires 3:1 for a boundary that identifies a
          control, while a hairline between rows has no such floor — and a border dark enough for a
          control looks heavy as a divider.
        </p>
        <ul class="semantic">
          @for (item of semantic; track item.token) {
            <li>
              <span class="semantic__chip" [style.background]="'var(' + item.token + ')'"></span>
              <code>{{ item.token }}</code>
              <span class="semantic__role">{{ item.role }}</span>
            </li>
          }
        </ul>
      </section>

      <section>
        <h2 class="h">Type scale</h2>
        <p class="p">A major third (1.250) from a 14px base. Data uses the mono face with tabular figures.</p>
        <ul class="type">
          @for (item of type; track item.token) {
            <li>
              <code>{{ item.token }}</code>
              <span class="type__px">{{ item.px }}</span>
              <span class="type__sample" [style.font-size]="'var(' + item.token + ')'">
                Failure to reproduce
              </span>
            </li>
          }
        </ul>
      </section>

      <section>
        <h2 class="h">Spacing</h2>
        <p class="p">A 4px base scale, from <code>--tx-space-0</code> to <code>--tx-space-24</code>.</p>
        <ul class="space">
          @for (step of space; track step) {
            <li>
              <span class="space__bar" [style.width]="'var(--tx-space-' + step + ')'"></span>
              <code>{{ step }}</code>
            </li>
          }
        </ul>
      </section>

      <div class="split">
        <section>
          <h2 class="h">Radius</h2>
          <div class="tiles">
            @for (step of radius; track step) {
              <div class="tile" [style.border-radius]="'var(--tx-radius-' + step + ')'">
                <code>{{ step }}</code>
              </div>
            }
          </div>
        </section>

        <section>
          <h2 class="h">Elevation</h2>
          <div class="tiles">
            @for (step of elevation; track step) {
              <div class="tile tile--raised" [style.box-shadow]="'var(--tx-elevation-' + step + ')'">
                <code>{{ step }}</code>
              </div>
            }
          </div>
        </section>
      </div>
    </demo-page>
  `,
  styles: [
    `
      section {
        display: block;
      }
      .h {
        margin: 0 0 var(--tx-space-2);
        font-family: var(--tx-font-display);
        font-size: var(--tx-text-xl);
        font-weight: var(--tx-weight-semibold);
        letter-spacing: var(--tx-tracking-tight);
      }
      .p {
        max-width: 62ch;
        margin: 0 0 var(--tx-space-4);
        font-size: var(--tx-text-sm);
        color: var(--tx-color-on-surface-muted);
      }
      code {
        font-family: var(--tx-font-mono);
        font-size: var(--tx-text-xs);
      }
      .ramp + .ramp {
        margin-block-start: var(--tx-space-4);
      }
      .ramp__name {
        margin: 0 0 var(--tx-space-2);
        font-family: var(--tx-font-mono);
        font-size: var(--tx-text-2xs);
        letter-spacing: var(--tx-tracking-label);
        text-transform: uppercase;
        color: var(--tx-color-on-surface-muted);
      }
      .ramp__row {
        display: grid;
        grid-template-columns: repeat(10, minmax(0, 1fr));
        gap: var(--tx-space-1);
      }
      .swatch {
        display: flex;
        flex-direction: column;
        gap: var(--tx-space-1);
      }
      .swatch__chip {
        display: block;
        height: 3rem;
        border: var(--tx-border-width) solid var(--tx-color-border);
        border-radius: var(--tx-radius-sm);
      }
      .swatch__step {
        font-family: var(--tx-font-mono);
        font-size: var(--tx-text-2xs);
        font-variant-numeric: tabular-nums;
        color: var(--tx-color-on-surface-muted);
        text-align: center;
      }
      .semantic {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(21rem, 1fr));
        gap: 1px;
        background-color: var(--tx-color-border);
        border: var(--tx-border-width) solid var(--tx-color-border);
        border-radius: var(--tx-radius-lg);
        overflow: hidden;
      }
      .semantic li {
        display: flex;
        align-items: center;
        gap: var(--tx-space-3);
        padding: var(--tx-space-2) var(--tx-space-3);
        background-color: var(--tx-color-surface-raised);
      }
      .semantic__chip {
        width: 1.5rem;
        height: 1.5rem;
        flex: none;
        border: var(--tx-border-width) solid var(--tx-color-border);
        border-radius: var(--tx-radius-sm);
      }
      .semantic__role {
        margin-inline-start: auto;
        font-size: var(--tx-text-xs);
        color: var(--tx-color-on-surface-muted);
        text-align: end;
      }
      .type {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
      }
      .type li {
        display: flex;
        align-items: baseline;
        gap: var(--tx-space-4);
        padding: var(--tx-space-2) 0;
        border-block-end: var(--tx-border-width) solid var(--tx-color-border);
      }
      .type__px {
        width: 4rem;
        flex: none;
        font-family: var(--tx-font-mono);
        font-size: var(--tx-text-2xs);
        font-variant-numeric: tabular-nums;
        color: var(--tx-color-on-surface-subtle);
      }
      .type li code {
        width: 9rem;
        flex: none;
        color: var(--tx-color-on-surface-muted);
      }
      .type__sample {
        font-family: var(--tx-font-display);
        letter-spacing: var(--tx-tracking-tight);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .space {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: var(--tx-space-2);
      }
      .space li {
        display: flex;
        align-items: center;
        gap: var(--tx-space-3);
      }
      .space__bar {
        height: 0.75rem;
        flex: none;
        background-color: var(--tx-color-accent);
        border-radius: var(--tx-radius-sm);
      }
      .split {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
        gap: var(--tx-space-6);
      }
      .tiles {
        display: flex;
        flex-wrap: wrap;
        gap: var(--tx-space-3);
      }
      .tile {
        display: grid;
        place-items: center;
        width: 5rem;
        height: 4rem;
        background-color: var(--tx-color-surface-variant);
        border: var(--tx-border-width) solid var(--tx-color-border);
      }
      .tile--raised {
        background-color: var(--tx-color-surface-raised);
        border-color: transparent;
        border-radius: var(--tx-radius-lg);
      }
    `,
  ],
})
export class TokensPage {
  protected readonly ramp = RAMP;
  protected readonly semantic = SEMANTIC;
  protected readonly type = TYPE;
  protected readonly space = SPACE;
  protected readonly radius = RADIUS;
  protected readonly elevation = ELEVATION;
}
