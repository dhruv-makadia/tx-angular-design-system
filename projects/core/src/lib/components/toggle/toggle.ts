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
 * An on/off switch.
 *
 * A checkbox with `role="switch"` — the pattern assistive technology expects
 * for a control that takes effect immediately, as opposed to a checkbox whose
 * value is submitted with a form.
 *
 * ```html
 * <tx-toggle [(checked)]="notifications">Email notifications</tx-toggle>
 * ```
 *
 * ### Keyboard
 * `Tab` focuses, `Space` toggles.
 */
@Component({
  selector: 'tx-toggle',
  standalone: true,
  templateUrl: './toggle.html',
  styleUrl: './toggle.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'tx-toggle',
    '[class.tx-toggle--disabled]': 'isDisabled()',
  },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TxToggle), multi: true }],
})
export class TxToggle implements ControlValueAccessor {
  readonly label = input<string>('');
  readonly hint = input<string>('');
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Puts the switch after the label instead of before it. */
  readonly labelFirst = input(true, { transform: booleanAttribute });

  readonly checked = model(false);

  protected readonly id = `tx-toggle-${nextId++}`;
  protected readonly cvaDisabled = signal(false);

  private onChange: (value: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  protected readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());

  protected toggle(event: Event): void {
    const next = (event.target as HTMLInputElement).checked;
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
