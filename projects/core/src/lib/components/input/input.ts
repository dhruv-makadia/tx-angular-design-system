import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  forwardRef,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type TxInputType = 'text' | 'number' | 'email' | 'password' | 'search' | 'tel' | 'url';

let nextId = 0;

/**
 * A single-line text field.
 *
 * Works with both form systems: `ControlValueAccessor` for reactive forms, and
 * the structural `FormValueControl<string>` contract for Signal Forms.
 *
 * ```html
 * <tx-input label="Email" type="email" [(value)]="email" required />
 *
 * <tx-input label="Search" type="search" clearable>
 *   <tx-icon slot="prefix" name="search" />
 * </tx-input>
 * ```
 *
 * ### Keyboard
 * Standard text-field behaviour. `Escape` clears the field when `clearable`.
 */
@Component({
  selector: 'tx-input',
  standalone: true,
  templateUrl: './input.html',
  styleUrls: ['../../shared/field.css', './input.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'tx-input',
    '[class.tx-input--disabled]': 'isDisabled()',
    '[class.tx-input--invalid]': 'invalid()',
  },
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TxInput), multi: true },
  ],
})
export class TxInput implements ControlValueAccessor {
  readonly label = input<string>('');
  readonly type = input<TxInputType>('text');
  readonly placeholder = input<string>('');
  readonly hint = input<string>('');
  readonly error = input<string>('');
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly clearable = input(false, { transform: booleanAttribute });
  readonly autocomplete = input<string>('');
  /** Shows a live `used / max` counter and caps input length. */
  readonly maxLength = input<number | null>(null);

  readonly value = model<string>('');

  readonly focused = output<FocusEvent>();
  readonly blurred = output<FocusEvent>();

  protected readonly id = `tx-input-${nextId++}`;
  protected readonly cvaDisabled = signal(false);
  protected readonly clearLabel = $localize`:@@tx.input.clear:Clear`;

  private readonly fieldRef = viewChild.required<ElementRef<HTMLInputElement>>('field');

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  protected readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());
  protected readonly showClear = computed(
    () => this.clearable() && this.value().length > 0 && !this.isDisabled() && !this.readonly(),
  );
  protected readonly counter = computed(() => {
    const max = this.maxLength();
    return max === null ? null : `${this.value().length} / ${max}`;
  });
  protected readonly describedBy = computed(() =>
    this.hint() || this.error() || this.counter() ? `${this.id}-desc` : null,
  );

  protected onInput(event: Event): void {
    this.commit((event.target as HTMLInputElement).value);
  }

  protected onBlur(event: FocusEvent): void {
    this.onTouched();
    this.blurred.emit(event);
  }

  protected clear(): void {
    this.commit('');
    this.fieldRef().nativeElement.focus();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.showClear()) {
      event.preventDefault();
      this.clear();
    }
  }

  private commit(next: string): void {
    this.value.set(next);
    this.onChange(next);
  }

  // --- ControlValueAccessor ------------------------------------------------
  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }
}

function booleanAttribute(value: unknown): boolean {
  return value != null && `${value}` !== 'false';
}
