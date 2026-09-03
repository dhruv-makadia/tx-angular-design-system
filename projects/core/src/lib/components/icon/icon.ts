import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TxIconRegistry } from './icon-registry';

export type TxIconSize = 'sm' | 'md' | 'lg';

/**
 * Renders a registered icon as inline SVG.
 *
 * Inline SVG over an icon font or a sprite sheet: it inherits `currentColor`,
 * scales without hinting artefacts, needs no extra network request (so it works
 * offline), and carries no font payload. Because icons are registered as path
 * geometry rather than markup, none of it passes through `innerHTML`.
 *
 * ```html
 * <tx-icon name="check" />
 * <tx-icon name="trash" size="lg" label="Delete" />
 * ```
 *
 * Decorative by default (`aria-hidden`). Give it a `label` and it becomes an
 * image with an accessible name.
 */
@Component({
  selector: 'tx-icon',
  standalone: true,
  template: `
    @if (icon(); as def) {
      <svg
        [attr.viewBox]="def.viewBox ?? '0 0 24 24'"
        [attr.fill]="def.stroked === false ? 'currentColor' : 'none'"
        [attr.stroke]="def.stroked === false ? 'none' : 'currentColor'"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
        focusable="false"
        aria-hidden="true"
      >
        @for (d of def.paths; track d) {
          <path [attr.d]="d" />
        }
      </svg>
    }
  `,
  styleUrl: './icon.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'tx-icon',
    '[attr.data-size]': 'size()',
    '[attr.role]': 'label() ? "img" : null',
    '[attr.aria-label]': 'label() || null',
    '[attr.aria-hidden]': 'label() ? null : "true"',
  },
})
export class TxIcon {
  private readonly registry = inject(TxIconRegistry);

  /** Registered icon name. Unknown names render nothing. */
  readonly name = input.required<string>();
  readonly size = input<TxIconSize>('md');
  /** Accessible name. Omit for decorative icons. */
  readonly label = input<string>('');

  protected readonly icon = computed(() => this.registry.get(this.name()));
}
