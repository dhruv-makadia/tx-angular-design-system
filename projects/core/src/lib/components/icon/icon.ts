import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import {
  TxIconDefinition,
  TxIconInput,
  TxIconRegistry,
  txIconDefinition,
} from './icon-registry';

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
 *
 * ### One-off icons
 * `path` draws geometry directly, without registering anything:
 *
 * ```html
 * <tx-icon path="M12 2l3 7h7l-6 4 2 7-6-4-6 4 2-7-6-4h7z" />
 * <tx-icon [path]="['M4 12h16', 'M12 4v16']" viewBox="0 0 24 24" filled />
 * ```
 *
 * It wins over `name`, and it is the escape hatch, not the habit: an icon used
 * on more than one screen belongs in `provideTxIcons` so it has a name, can be
 * swapped in one place, and shows up in `registry.names()`.
 */
@Component({
  selector: 'tx-icon',
  standalone: true,
  template: `
    @if (icon(); as def) {
      <svg
        [attr.viewBox]="viewBox() || def.viewBox || '0 0 24 24'"
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

  /** Registered icon name. Unknown names render nothing rather than throwing. */
  readonly name = input<string>('');
  /**
   * Path geometry drawn directly — one `d` string, or several. Takes
   * precedence over `name`, so an unregistered one-off needs no setup.
   */
  readonly path = input<TxIconInput>('');
  /** Overrides the icon's own grid. Defaults to the 24-unit one. */
  readonly viewBox = input<string>('');
  /** Solid glyph rather than a stroked one — the inverse of `stroked`. */
  readonly filled = input(false, { transform: booleanAttribute });
  readonly size = input<TxIconSize>('md');
  /** Accessible name. Omit for decorative icons. */
  readonly label = input<string>('');

  protected readonly icon = computed<TxIconDefinition | undefined>(() => {
    const inline = this.path();
    const name = this.name();
    const def = hasGeometry(inline)
      ? txIconDefinition(inline)
      : name
        ? this.registry.get(name)
        : undefined;

    if (!def) return undefined;
    // `filled` is an input, so it wins over whatever the definition said.
    return this.filled() ? { ...def, stroked: false } : def;
  });
}

/** An empty string or an empty array means "nothing supplied", not "draw nothing". */
function hasGeometry(icon: TxIconInput): boolean {
  if (typeof icon === 'string') return icon.length > 0;
  if (Array.isArray(icon)) return icon.length > 0;
  return true;
}

function booleanAttribute(value: unknown): boolean {
  return value != null && `${value}` !== 'false';
}
