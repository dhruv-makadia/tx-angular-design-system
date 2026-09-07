import { OverlayModule } from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TxCalendar } from './calendar';
import {
  txClampDate,
  txFormatIsoDate,
  txIsSameDay,
  txIsValidDate,
  txIsWithin,
  txParseIsoDate,
  txStartOfDay,
} from '../../utils/date';

let nextId = 0;

/**
 * A date field with a calendar panel.
 *
 * Works with both form systems: `ControlValueAccessor` for reactive forms, and
 * a `Date | null` model for template-driven and Signal Forms use.
 *
 * ```html
 * <tx-datepicker label="Due" [(value)]="due" [min]="today" clearable />
 *
 * <tx-datepicker label="Shipped" formControlName="shipped"
 *   [dateDisabled]="isWeekend" hint="Weekdays only" />
 * ```
 *
 * ### Typing, not just clicking
 * The field is a real text input, because typing `2026-03-14` is faster than
 * paging to it and is the only route for someone who cannot use a pointer.
 * Input is parsed on blur and on `Enter`; anything unparseable is reported
 * through `parseError` and leaves the value untouched rather than silently
 * clearing it.
 *
 * The default format is ISO `yyyy-mm-dd`: unambiguous in every locale, unlike
 * `03/04/2026`, which is two different days depending on who reads it. Supply
 * `formatDate` and `parseDate` together to use something else.
 *
 * ### Dates are calendar dates
 * Values are normalised to local midnight. See `utils/date.ts` for why a native
 * `Date` carries them.
 *
 * ### Keyboard
 * | Key | Action |
 * | --- | --- |
 * | `Enter` | Commit what is typed |
 * | `↓` `Alt`+`↓` | Open the calendar |
 * | `Escape` | Close the calendar, keeping the value |
 * | see {@link TxCalendar} | Navigation inside the grid |
 */
@Component({
  selector: 'tx-datepicker',
  standalone: true,
  imports: [OverlayModule, TxCalendar],
  templateUrl: './datepicker.html',
  styleUrls: ['../../shared/field.css', './datepicker.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'tx-datepicker',
    '[class.tx-datepicker--disabled]': 'isDisabled()',
    '[class.tx-datepicker--invalid]': 'showsInvalid()',
    '[class.tx-datepicker--open]': 'expanded()',
  },
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TxDatepicker), multi: true },
  ],
})
export class TxDatepicker implements ControlValueAccessor {
  private readonly hostRef = inject(ElementRef<HTMLElement>);

  readonly label = input<string>('');
  readonly placeholder = input<string>('yyyy-mm-dd');
  readonly hint = input<string>('');
  readonly error = input<string>('');
  readonly ariaLabel = input<string>('');
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly clearable = input(false, { transform: booleanAttribute });

  readonly min = input<Date | null>(null);
  readonly max = input<Date | null>(null);
  /** Blocks days inside the range that are still not choosable. */
  readonly dateDisabled = input<((date: Date) => boolean) | null>(null);
  /** 0 is Sunday. Defaults to Monday. */
  readonly firstDayOfWeek = input<number>(1);
  readonly locale = input<string | undefined>(undefined);
  readonly today = input<Date>(txStartOfDay(new Date()));

  /** Must round-trip with `parseDate`. Change both or neither. */
  readonly formatDate = input<(date: Date) => string>(txFormatIsoDate);
  readonly parseDate = input<(text: string) => Date | null>(txParseIsoDate);

  readonly value = model<Date | null>(null);

  readonly opened = output<void>();
  readonly closed = output<void>();
  /** The field held text that could not be read as a date. Null once it can. */
  readonly parseError = output<string | null>();

  protected readonly id = `tx-datepicker-${nextId++}`;
  protected readonly expanded = signal(false);
  protected readonly cvaDisabled = signal(false);
  /** What is in the box while it is being typed into. Null means "show value". */
  protected readonly draft = signal<string | null>(null);
  protected readonly badInput = signal(false);

  protected readonly clearLabel = $localize`:@@tx.datepicker.clear:Clear date`;
  protected readonly openLabel = $localize`:@@tx.datepicker.open:Choose a date`;
  protected readonly invalidText = $localize`:@@tx.datepicker.invalid:Not a date we can read`;
  protected readonly rangeText = $localize`:@@tx.datepicker.range:That date is outside the allowed range`;

  private readonly fieldRef = viewChild.required<ElementRef<HTMLInputElement>>('field');
  private readonly calendarRef = viewChild<TxCalendar>(TxCalendar);

  private onChange: (value: Date | null) => void = () => {};
  private onTouched: () => void = () => {};

  protected readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());

  /** The draft wins while typing, so the caret is never yanked around. */
  protected readonly text = computed(() => {
    const draft = this.draft();
    if (draft !== null) return draft;
    const value = this.value();
    return value ? this.formatDate()(value) : '';
  });

  protected readonly showClear = computed(
    () => this.clearable() && !!this.value() && !this.isDisabled() && !this.readonly(),
  );

  /** A field the consumer marked invalid, or one holding text we cannot read. */
  protected readonly showsInvalid = computed(() => this.invalid() || this.badInput());

  protected readonly message = computed(() => {
    if (this.badInput()) return this.outOfRangeDraft() ? this.rangeText : this.invalidText;
    if (this.invalid() && this.error()) return this.error();
    return this.hint();
  });

  protected readonly describedBy = computed(() =>
    this.message() ? `${this.id}-desc` : null,
  );

  constructor() {
    // Opening should land on the selected day, or on today, or on the nearest
    // day in range — never on a blank grid with no tab stop.
    effect(() => {
      if (!this.expanded()) return;
      const anchor = txClampDate(this.value() ?? this.today(), this.min(), this.max());
      queueMicrotask(() => this.calendarRef()?.focusDate(anchor));
    });
  }

  protected open(): void {
    if (this.isDisabled() || this.readonly() || this.expanded()) return;
    this.expanded.set(true);
    this.opened.emit();
  }

  protected close(refocus = true): void {
    if (!this.expanded()) return;
    this.expanded.set(false);
    this.onTouched();
    this.closed.emit();
    if (refocus) this.fieldRef().nativeElement.focus();
  }

  protected toggle(): void {
    this.expanded() ? this.close() : this.open();
  }

  protected onInput(event: Event): void {
    this.draft.set((event.target as HTMLInputElement).value);
    // Clearing the field clears the value; anything else waits for a commit, so
    // the value does not thrash while a date is half-typed.
    if (this.draft()!.trim() === '') this.commit(null, { keepDraft: true });
  }

  protected onFieldKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.open();
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      this.commitDraft();
      return;
    }
    if (event.key === 'Escape' && this.expanded()) {
      event.preventDefault();
      this.close();
    }
  }

  protected onBlur(): void {
    this.commitDraft();
    this.onTouched();
  }

  protected onCalendarSelect(date: Date): void {
    this.commit(date);
    this.close();
  }

  protected clear(event: Event): void {
    event.stopPropagation();
    this.commit(null);
    this.fieldRef().nativeElement.focus();
  }

  protected onOutsideClick(event: MouseEvent): void {
    // The click that opens the panel also lands here; closing on it would make
    // the panel look like it never opened.
    const target = event.target as Node | null;
    if (target && this.hostRef.nativeElement.contains(target)) return;
    this.close(false);
  }

  protected onPanelKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    }
  }

  /** Whether the unreadable draft is unreadable only because it is out of range. */
  private outOfRangeDraft(): boolean {
    const draft = this.draft();
    if (!draft) return false;
    const parsed = this.parseDate()(draft);
    return !!parsed && !txIsWithin(parsed, this.min(), this.max());
  }

  /**
   * Reads the field. Unparseable or out-of-range text is *reported*, not
   * discarded: the value stays as it was and the draft stays on screen, so
   * nobody loses what they typed to a silent correction.
   */
  private commitDraft(): void {
    const draft = this.draft();
    if (draft === null) return;

    const text = draft.trim();
    if (text === '') {
      this.setBadInput(false);
      this.commit(null);
      return;
    }

    const parsed = this.parseDate()(text);
    if (!parsed || !txIsValidDate(parsed) || !txIsWithin(parsed, this.min(), this.max())) {
      this.setBadInput(true, text);
      return;
    }

    this.setBadInput(false);
    this.commit(txStartOfDay(parsed));
  }

  private setBadInput(bad: boolean, text = ''): void {
    if (this.badInput() === bad) return;
    this.badInput.set(bad);
    this.parseError.emit(bad ? text : null);
  }

  private commit(next: Date | null, options: { keepDraft?: boolean } = {}): void {
    const normalised = next ? txStartOfDay(next) : null;
    if (!options.keepDraft) this.draft.set(null);
    if (txIsSameDay(normalised, this.value())) return;

    this.value.set(normalised);
    this.onChange(normalised);
  }

  // --- ControlValueAccessor ------------------------------------------------
  writeValue(value: Date | string | null): void {
    // Forms hand back whatever was seeded — often an ISO string from JSON.
    const parsed =
      typeof value === 'string' ? this.parseDate()(value) : txIsValidDate(value) ? value : null;
    this.draft.set(null);
    this.setBadInput(false);
    this.value.set(parsed ? txStartOfDay(parsed) : null);
  }
  registerOnChange(fn: (value: Date | null) => void): void {
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
