import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type TxSpinnerSize = 'sm' | 'md' | 'lg';

/** Geometry of the SVG circle the ring is drawn on. */
const RADIUS = 9;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
/** Proportion of the ring left open on the indeterminate arc. */
const INDETERMINATE_GAP = 0.3;

/**
 * A busy indicator.
 *
 * Indeterminate by default — a rotating arc that says only "still working".
 * Give it a `value` and it becomes a determinate ring, which is worth doing
 * whenever you actually know the proportion: a progress ring answers "how much
 * longer", a spinner cannot.
 *
 * ```html
 * <tx-spinner />
 * <tx-spinner size="lg" label="Loading results" showLabel />
 * <tx-spinner [value]="uploaded()" label="Uploading" />
 * ```
 *
 * It draws in `currentColor`, so it takes the colour of whatever it sits in.
 * Override the diameter with `--tx-spinner-size` for a size the three steps do
 * not cover.
 *
 * ### Accessibility
 * It is a `progressbar`: indeterminate when `value` is null (no
 * `aria-valuenow`, which is how ARIA spells "unknown"), determinate otherwise.
 * `label` is its accessible name and is required in spirit — the default,
 * "Loading…", is a fallback rather than a description.
 */
@Component({
  selector: 'tx-spinner',
  standalone: true,
  templateUrl: './spinner.html',
  styleUrl: './spinner.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'tx-spinner',
    '[attr.data-size]': 'size()',
    '[class.tx-spinner--determinate]': 'isDeterminate()',
    '[class.tx-spinner--inline]': 'inline()',
    role: 'progressbar',
    '[attr.aria-label]': 'showLabel() ? null : label()',
    '[attr.aria-valuemin]': 'isDeterminate() ? 0 : null',
    '[attr.aria-valuemax]': 'isDeterminate() ? 100 : null',
    '[attr.aria-valuenow]': 'percent()',
    '[attr.aria-valuetext]': 'isDeterminate() ? percent() + "%" : null',
  },
})
export class TxSpinner {
  /** 16, 24 or 40 px. Override with `--tx-spinner-size` for anything else. */
  readonly size = input<TxSpinnerSize>('md');
  /**
   * Completion from 0 to 100. `null` — the default — is indeterminate, which
   * ARIA spells as a `progressbar` with no `aria-valuenow`.
   */
  readonly value = input<number | null>(null);
  /** Accessible name. Say what is loading, not that something is. */
  readonly label = input($localize`:@@tx.spinner.label:Loading…`);
  /** Renders `label` beside the ring instead of hiding it in the a11y tree. */
  readonly showLabel = input(false, { transform: booleanAttribute });
  /** Sits on the text baseline rather than as a centred block. */
  readonly inline = input(false, { transform: booleanAttribute });

  protected readonly radius = RADIUS;

  protected readonly isDeterminate = computed(() => this.value() !== null);

  /** Clamped, rounded, and null while indeterminate. */
  protected readonly percent = computed(() => {
    const value = this.value();
    if (value === null || Number.isNaN(value)) return null;
    return Math.round(Math.min(100, Math.max(0, value)));
  });

  protected readonly circumference = CIRCUMFERENCE;

  /**
   * The gap left at the end of the arc.
   *
   * Indeterminate is a fixed arc that CSS rotates. It is most of the ring
   * rather than a quarter of it: at 16px a quarter-turn reads as a stray tick
   * mark, where a ring with a gap in it plainly reads as a spinner.
   */
  protected readonly dashOffset = computed(() => {
    const percent = this.percent();
    if (percent === null) return CIRCUMFERENCE * INDETERMINATE_GAP;
    return CIRCUMFERENCE * (1 - percent / 100);
  });
}

function booleanAttribute(value: unknown): boolean {
  return value != null && `${value}` !== 'false';
}
