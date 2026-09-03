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

let nextId = 0;

/**
 * A checkbox.
 *
 * Built on a real `<input type="checkbox">` that stays in the accessibility
 * tree and keeps native keyboard and form behaviour; the visible box is drawn
 * beside it and the input itself is clipped rather than hidden, so screen
 * readers and autofill still see it.
 *
 * Signal Forms integrates through the `FormCheckboxControl` contract — hence
 * `checked` rather than `value` as the model.
 *
 * ```html
 * <tx-checkbox [(checked)]="agreed">I agree</tx-checkbox>
 * <tx-checkbox [indeterminate]="someSelected()" [(checked)]="allSelected" />
 * ```
 *
 * ### Keyboard
 * `Tab` focuses, `Space` toggles.
 */
@Component({
  selector: 'tx-checkbox',
  standalone: true,
  templateUrl: './checkbox.html',
  styleUrl: './checkbox.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'tx-checkbox',
    '[class.tx-checkbox--disabled]': 'isDisabled()',
    '[class.tx-checkbox--invalid]': 'invalid()',
  },
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TxCheckbox), multi: true },
  ],
})
export class TxCheckbox implements ControlValueAccessor {
  readonly label = input<string>('');
  readonly hint = input<string>('');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Renders the mixed state. Cleared as soon as the user toggles. */
  readonly indeterminate = model(false);

  readonly checked = model(false);

  protected readonly id = `tx-checkbox-${nextId++}`;
  protected readonly cvaDisabled = signal(false);

  private onChange: (value: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  protected readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());
  protected readonly ariaChecked = computed(() =>
    this.indeterminate() ? 'mixed' : this.checked() ? 'true' : 'false',
  );

  protected toggle(event: Event): void {
    const next = (event.target as HTMLInputElement).checked;
    this.indeterminate.set(false);
    this.checked.set(next);
    this.onChange(next);
    this.onTouched();
  }

  // --- ControlValueAccessor ------------------------------------------------
  writeValue(value: boolean | null): void {
    this.checked.set(!!value);
  }
  registerOnChange(fn: (value: boolean) => void): void {
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
