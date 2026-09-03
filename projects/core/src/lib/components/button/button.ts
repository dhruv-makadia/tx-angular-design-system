import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export type TxButtonVariant = 'filled' | 'tonal' | 'outlined' | 'text' | 'danger';
export type TxButtonSize = 'sm' | 'md' | 'lg';

/**
 * A button.
 *
 * Renders a real `<button>` so it is focusable, form-associable and
 * keyboard-operable without any extra work — there is no ARIA here because
 * none is needed.
 *
 * ```html
 * <tx-button variant="filled" (activated)="save()">Save</tx-button>
 * <tx-button variant="outlined" size="sm" [loading]="saving()">Retry</tx-button>
 * ```
 *
 * Project icons into the `leading` / `trailing` slots:
 *
 * ```html
 * <tx-button>
 *   <tx-icon slot="leading" name="check" />
 *   Approve
 * </tx-button>
 * ```
 *
 * ### Keyboard
 * `Tab` focuses, `Enter` and `Space` activate. While `loading` is set the
 * button is disabled and announces itself as busy.
 */
@Component({
  selector: 'tx-button',
  standalone: true,
  templateUrl: './button.html',
  styleUrl: './button.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'tx-button',
    '[class.tx-button--full]': 'fullWidth()',
    '[attr.data-variant]': 'variant()',
    '[attr.data-size]': 'size()',
  },
})
export class TxButton {
  readonly variant = input<TxButtonVariant>('filled');
  readonly size = input<TxButtonSize>('md');
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Disables the button and shows a spinner in place of the leading slot. */
  readonly loading = input(false, { transform: booleanAttribute });
  readonly fullWidth = input(false, { transform: booleanAttribute });
  /** Required when the button shows only an icon. */
  readonly ariaLabel = input<string>('');

  /** Emitted on activation. Not emitted while disabled or loading. */
  readonly activated = output<MouseEvent>();

  protected readonly isDisabled = computed(() => this.disabled() || this.loading());

  protected onClick(event: MouseEvent): void {
    if (this.isDisabled()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.activated.emit(event);
  }
}

function booleanAttribute(value: unknown): boolean {
  return value != null && `${value}` !== 'false';
}
