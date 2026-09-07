import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  txAddDays,
  txAddMonths,
  txAddYears,
  txClampDate,
  txEndOfMonth,
  txIsSameDay,
  txIsSameMonth,
  txIsWithin,
  txMonthGrid,
  txStartOfDay,
  txStartOfMonth,
} from '../../utils/date';

/** One rendered day. Precomputed so the template stays free of logic. */
export interface TxCalendarDay {
  readonly date: Date;
  readonly label: string;
  readonly day: number;
  readonly outside: boolean;
  readonly today: boolean;
  readonly selected: boolean;
  readonly disabled: boolean;
  readonly focusable: boolean;
}

let nextId = 0;

/**
 * A month grid.
 *
 * Usable on its own for an always-visible calendar, and used by
 * {@link TxDatepicker} inside its panel.
 *
 * ```html
 * <tx-calendar [(value)]="due" [min]="today" [dateDisabled]="isWeekend" />
 * ```
 *
 * ### Why the keyboard is hand-written
 * Angular Aria's `Grid` owns roving focus across a *fixed* set of cells. A
 * calendar is not that: `→` on the 31st has to page to the next month and land
 * on the 1st, which re-renders every cell and moves the active one somewhere
 * Aria has no public API to point at. The ARIA semantics here are the ones Aria
 * would emit — `role="grid"`, `gridcell`, `aria-selected`, a single tab stop —
 * but the navigation is ours. See DECISIONS D54.
 *
 * ### Keyboard
 * | Key | Action |
 * | --- | --- |
 * | `←` `→` | Previous or next day, across month boundaries |
 * | `↑` `↓` | Same weekday, previous or next week |
 * | `Home` `End` | First or last day of the week |
 * | `PageUp` `PageDown` | Previous or next month |
 * | `Shift` + `PageUp` `PageDown` | Previous or next year |
 * | `Enter` `Space` | Select the focused day |
 */
@Component({
  selector: 'tx-calendar',
  standalone: true,
  templateUrl: './calendar.html',
  styleUrl: './calendar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'tx-calendar' },
})
export class TxCalendar {
  /** The selected day, or null. Normalised to local midnight on the way in. */
  readonly value = model<Date | null>(null);
  readonly min = input<Date | null>(null);
  readonly max = input<Date | null>(null);
  /** Blocks individual days that are inside the range but still not choosable. */
  readonly dateDisabled = input<((date: Date) => boolean) | null>(null);
  readonly disabled = input(false, { transform: booleanAttribute });
  /** 0 is Sunday. Defaults to Monday, which most of the world starts on. */
  readonly firstDayOfWeek = input<number>(1);
  /** BCP 47 tag for month and weekday names. Defaults to the runtime locale. */
  readonly locale = input<string | undefined>(undefined);
  /** Overridable so a test — or a "what fell on this date" view — can pin it. */
  readonly today = input<Date>(txStartOfDay(new Date()));
  /** Accessible name for the grid. */
  readonly label = input($localize`:@@tx.calendar.label:Calendar`);

  readonly dateSelect = output<Date>();
  /** The displayed month changed — paging, or following a selection in. */
  readonly monthChange = output<Date>();

  protected readonly id = `tx-calendar-${nextId++}`;

  private readonly gridRef = viewChild<ElementRef<HTMLElement>>('grid');

  /** The month on screen. Independent of the selection: you can browse away. */
  private readonly viewMonth = signal<Date | null>(null);
  /** The day the single tab stop sits on. */
  private readonly activeDate = signal<Date | null>(null);
  /** Bumped when a key or a page button moved focus, so the effect follows it. */
  private readonly focusPending = signal(0);

  protected readonly prevLabel = $localize`:@@tx.calendar.prev:Previous month`;
  protected readonly nextLabel = $localize`:@@tx.calendar.next:Next month`;

  /**
   * Falls back to the selection, then today, then clamped into range — so a
   * calendar whose whole range is in the past still opens somewhere useful.
   */
  protected readonly month = computed(() => {
    const explicit = this.viewMonth();
    if (explicit) return explicit;
    const anchor = this.value() ?? this.today();
    return txStartOfMonth(txClampDate(anchor, this.min(), this.max()));
  });

  protected readonly active = computed(() => {
    const explicit = this.activeDate();
    const month = this.month();
    if (explicit && txIsSameMonth(explicit, month)) return explicit;

    // Landing on a month nobody navigated to: prefer the selection, then today,
    // then the first day that is actually choosable.
    const preferred = [this.value(), this.today()].find((d) => d && txIsSameMonth(d, month));
    if (preferred) return preferred;

    const first = txStartOfMonth(month);
    return this.firstEnabledFrom(first) ?? first;
  });

  protected readonly monthLabel = computed(() =>
    new Intl.DateTimeFormat(this.locale(), { month: 'long', year: 'numeric' }).format(this.month()),
  );

  /** Short names, rotated to `firstDayOfWeek`, with a full name for the a11y tree. */
  protected readonly weekdays = computed(() => {
    const short = new Intl.DateTimeFormat(this.locale(), { weekday: 'short' });
    const long = new Intl.DateTimeFormat(this.locale(), { weekday: 'long' });
    const first = this.firstDayOfWeek();
    // Any Sunday will do as the origin; 1 January 2023 was one.
    const sunday = new Date(2023, 0, 1);
    return Array.from({ length: 7 }, (_, i) => {
      const date = txAddDays(sunday, (first + i) % 7);
      return { short: short.format(date), long: long.format(date) };
    });
  });

  protected readonly weeks = computed<TxCalendarDay[][]>(() => {
    const month = this.month();
    const active = this.active();
    const selected = this.value();
    const today = this.today();
    const full = new Intl.DateTimeFormat(this.locale(), { dateStyle: 'full' });

    return txMonthGrid(month, this.firstDayOfWeek()).map((week) =>
      week.map((date) => ({
        date,
        label: full.format(date),
        day: date.getDate(),
        outside: !txIsSameMonth(date, month),
        today: txIsSameDay(date, today),
        selected: txIsSameDay(date, selected),
        disabled: this.isDayDisabled(date),
        focusable: txIsSameDay(date, active),
      })),
    );
  });

  protected readonly canPrev = computed(() => {
    const min = this.min();
    if (!min) return true;
    return txEndOfMonth(txAddMonths(this.month(), -1)).getTime() >= txStartOfDay(min).getTime();
  });

  protected readonly canNext = computed(() => {
    const max = this.max();
    if (!max) return true;
    return txStartOfMonth(txAddMonths(this.month(), 1)).getTime() <= txStartOfDay(max).getTime();
  });

  constructor() {
    // Focus only ever moves in response to a key or a page button — never on a
    // value arriving from a form, which would steal focus from wherever the
    // user actually is.
    effect(() => {
      if (this.focusPending() === 0) return;
      this.active();
      queueMicrotask(() => {
        const cell = this.gridRef()?.nativeElement.querySelector<HTMLElement>('[tabindex="0"]');
        cell?.focus();
      });
    });
  }

  /** Puts the tab stop on a day and focuses it. Called on open, not on write. */
  focusDate(date: Date): void {
    const target = txClampDate(txStartOfDay(date), this.min(), this.max());
    this.viewMonth.set(txStartOfMonth(target));
    this.activeDate.set(target);
    this.focusPending.update((n) => n + 1);
  }

  protected isDayDisabled(date: Date): boolean {
    if (this.disabled()) return true;
    if (!txIsWithin(date, this.min(), this.max())) return true;
    return this.dateDisabled()?.(date) === true;
  }

  protected select(day: TxCalendarDay): void {
    if (day.disabled) return;
    const date = txStartOfDay(day.date);
    this.activeDate.set(date);
    // Clicking a trailing day of the next month should show that month, not
    // leave you looking at a selection you can no longer see.
    if (day.outside) this.setMonth(txStartOfMonth(date));
    this.value.set(date);
    this.dateSelect.emit(date);
  }

  protected page(months: number): void {
    this.moveActive(txAddMonths(this.active(), months));
  }

  protected onKeydown(event: KeyboardEvent): void {
    const active = this.active();
    let next: Date;

    switch (event.key) {
      case 'ArrowLeft':
        next = txAddDays(active, -1);
        break;
      case 'ArrowRight':
        next = txAddDays(active, 1);
        break;
      case 'ArrowUp':
        next = txAddDays(active, -7);
        break;
      case 'ArrowDown':
        next = txAddDays(active, 7);
        break;
      case 'Home':
        next = txAddDays(active, -weekdayOffset(active, this.firstDayOfWeek()));
        break;
      case 'End':
        next = txAddDays(active, 6 - weekdayOffset(active, this.firstDayOfWeek()));
        break;
      case 'PageUp':
        next = event.shiftKey ? txAddYears(active, -1) : txAddMonths(active, -1);
        break;
      case 'PageDown':
        next = event.shiftKey ? txAddYears(active, 1) : txAddMonths(active, 1);
        break;
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const day = this.weeks()
          .flat()
          .find((d) => txIsSameDay(d.date, active));
        if (day) this.select(day);
        return;
      }
      default:
        return;
    }

    event.preventDefault();
    this.moveActive(next);
  }

  /**
   * Moves the tab stop, paging the view when the target is in another month.
   *
   * A disabled day still takes focus — skipping it would make the edge of a
   * range unreachable and hide from a screen-reader user that the day exists at
   * all. Only `min` and `max` actually stop the cursor.
   */
  private moveActive(date: Date): void {
    const target = txClampDate(txStartOfDay(date), this.min(), this.max());
    if (!txIsSameMonth(target, this.month())) this.setMonth(txStartOfMonth(target));
    this.activeDate.set(target);
    this.focusPending.update((n) => n + 1);
  }

  private setMonth(month: Date): void {
    this.viewMonth.set(month);
    this.monthChange.emit(month);
  }

  private firstEnabledFrom(start: Date): Date | null {
    const end = txEndOfMonth(start);
    for (let d = start; d.getTime() <= end.getTime(); d = txAddDays(d, 1)) {
      if (!this.isDayDisabled(d)) return d;
    }
    return null;
  }

  protected trackWeek = (index: number): number => index;
  protected trackDay = (_: number, day: TxCalendarDay): number => day.date.getTime();
}

/** How far into its week a date sits, given the week's first day. */
function weekdayOffset(date: Date, firstDayOfWeek: number): number {
  return (date.getDay() - firstDayOfWeek + 7) % 7;
}

function booleanAttribute(value: unknown): boolean {
  return value != null && `${value}` !== 'false';
}
