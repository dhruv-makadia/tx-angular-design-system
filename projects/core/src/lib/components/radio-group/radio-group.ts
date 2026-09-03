import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  model,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TxSelectOption } from '../../utils/types';

let nextId = 0;

/**
 * A group of mutually exclusive choices.
 *
 * Native `<input type="radio">` elements sharing a `name`, wrapped in a
 * `<fieldset>` with a `<legend>`. That gives roving focus, arrow-key
 * navigation and group labelling from the platform, with nothing to
 * reimplement — which is why this one does not use an Aria primitive.
 *
 * ```html
 * <tx-radio-group label="Delivery" [options]="deliveryOptions" [(value)]="delivery" />
 * ```
 *
 * ### Keyboard
 * `Tab` enters the group at the selected option; the arrow keys move and select.
 */
@Component({
  selector: 'tx-radio-group',
  standalone: true,
  templateUrl: './radio-group.html',
  styleUrl: './radio-group.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'tx-radio-group',
    '[class.tx-radio-group--disabled]': 'isDisabled()',
    '[class.tx-radio-group--invalid]': 'invalid()',
  },
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TxRadioGroup), multi: true },
  ],
})
export class TxRadioGroup<V> implements ControlValueAccessor {
  readonly options = input.required<readonly TxSelectOption<V>[]>();
  readonly label = input<string>('');
  readonly hint = input<string>('');
  readonly error = input<string>('');
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Lays the options out in a row instead of a column. */
  readonly inline = input(false, { transform: booleanAttribute });
  readonly compareWith = input<(a: V, b: V) => boolean>(Object.is);

  readonly value = model<V | null>(null);

  protected readonly id = `tx-radio-group-${nextId++}`;
  protected readonly cvaDisabled = signal(false);

  private onChange: (value: V | null) => void = () => {};
  private onTouched: () => void = () => {};

  protected readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());

  protected isChecked(option: TxSelectOption<V>): boolean {
    const current = this.value();
    if (current === null || current === undefined) return false;
    return this.compareWith()(option.value, current);
  }

  protected select(option: TxSelectOption<V>): void {
    if (option.disabled || this.isDisabled()) return;
    this.value.set(option.value);
    this.onChange(option.value);
    this.onTouched();
  }

  // --- ControlValueAccessor ------------------------------------------------
  writeValue(value: V | null): void {
    this.value.set(value ?? null);
  }
  registerOnChange(fn: (value: V | null) => void): void {
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
