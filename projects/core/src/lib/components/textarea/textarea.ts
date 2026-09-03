import { TextFieldModule } from '@angular/cdk/text-field';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let nextId = 0;

/**
 * A multi-line text field that grows with its content.
 *
 * Auto-sizing comes from the CDK's `cdkTextareaAutosize`, which measures in a
 * detached clone rather than thrashing layout on every keystroke. Set
 * `autosize` false for a fixed-height box.
 *
 * The API mirrors {@link TxInput} deliberately: same label/hint/error/counter
 * shape, so the two are interchangeable in a form.
 *
 * ```html
 * <tx-textarea label="Notes" [(value)]="notes" [minRows]="3" [maxRows]="10" />
 * ```
 */
@Component({
  selector: 'tx-textarea',
  standalone: true,
  imports: [TextFieldModule],
  templateUrl: './textarea.html',
  styleUrls: ['../../shared/field.css', './textarea.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'tx-textarea',
    '[class.tx-textarea--disabled]': 'isDisabled()',
    '[class.tx-textarea--invalid]': 'invalid()',
  },
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TxTextarea), multi: true },
  ],
})
export class TxTextarea implements ControlValueAccessor {
  readonly label = input<string>('');
  readonly placeholder = input<string>('');
  readonly hint = input<string>('');
  readonly error = input<string>('');
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly autosize = input(true, { transform: booleanAttribute });
  readonly minRows = input(3);
  readonly maxRows = input(12);
  readonly maxLength = input<number | null>(null);

  readonly value = model<string>('');

  readonly focused = output<FocusEvent>();
  readonly blurred = output<FocusEvent>();

  protected readonly id = `tx-textarea-${nextId++}`;
  protected readonly cvaDisabled = signal(false);

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  protected readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());
  protected readonly counter = computed(() => {
    const max = this.maxLength();
    return max === null ? null : `${this.value().length} / ${max}`;
  });
  protected readonly describedBy = computed(() =>
    this.hint() || this.error() || this.counter() ? `${this.id}-desc` : null,
  );

  protected onInput(event: Event): void {
    const next = (event.target as HTMLTextAreaElement).value;
    this.value.set(next);
    this.onChange(next);
  }

  protected onBlur(event: FocusEvent): void {
    this.onTouched();
    this.blurred.emit(event);
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
