import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TxCalendar } from './calendar';
import { TxDatepicker } from './datepicker';
import {
  txAddMonths,
  txDaysInMonth,
  txFormatIsoDate,
  txIsSameDay,
  txMonthGrid,
  txParseIsoDate,
  txStartOfDay,
} from '../../utils/date';

/** A fixed "today" so nothing here depends on when it runs. */
const TODAY = new Date(2026, 2, 14); // Saturday 14 March 2026

describe('date utilities', () => {
  it('adds months without overflowing into the month after next', () => {
    // The naive setMonth turns 31 January into 3 March.
    expect(txFormatIsoDate(txAddMonths(new Date(2026, 0, 31), 1))).toBe('2026-02-28');
    expect(txFormatIsoDate(txAddMonths(new Date(2024, 0, 31), 1))).toBe('2024-02-29');
    expect(txFormatIsoDate(txAddMonths(new Date(2026, 4, 31), -1))).toBe('2026-04-30');
  });

  it('formats in local time, not UTC', () => {
    // toISOString would shift the day either side of the date line.
    expect(txFormatIsoDate(new Date(2026, 0, 1))).toBe('2026-01-01');
    expect(txFormatIsoDate(new Date(2026, 11, 31))).toBe('2026-12-31');
  });

  it('rejects a date that does not exist rather than rolling it forward', () => {
    expect(txParseIsoDate('2026-02-30')).toBeNull();
    expect(txParseIsoDate('2026-13-01')).toBeNull();
    expect(txParseIsoDate('2026-00-10')).toBeNull();
    expect(txParseIsoDate('nonsense')).toBeNull();
    expect(txParseIsoDate('')).toBeNull();
  });

  it('accepts the separators people actually type', () => {
    for (const text of ['2026-03-14', '2026/03/14', '2026.03.14', '2026-3-14']) {
      expect(txFormatIsoDate(txParseIsoDate(text)!)).toBe('2026-03-14');
    }
  });

  it('knows leap years', () => {
    expect(txDaysInMonth(2024, 1)).toBe(29);
    expect(txDaysInMonth(2026, 1)).toBe(28);
    expect(txDaysInMonth(2000, 1)).toBe(29);
    expect(txDaysInMonth(1900, 1)).toBe(28);
  });

  it('builds a six-week grid that starts on the requested weekday', () => {
    const grid = txMonthGrid(new Date(2026, 2, 1), 1);
    expect(grid.length).toBe(6);
    expect(grid.every((w) => w.length === 7)).toBe(true);
    // Monday-first: March 2026 begins on a Sunday, so the row starts 23 Feb.
    expect(txFormatIsoDate(grid[0][0])).toBe('2026-02-23');
    expect(grid[0][0].getDay()).toBe(1);

    const sundayFirst = txMonthGrid(new Date(2026, 2, 1), 0);
    expect(sundayFirst[0][0].getDay()).toBe(0);
    expect(txFormatIsoDate(sundayFirst[0][0])).toBe('2026-03-01');
  });
});

@Component({
  standalone: true,
  imports: [TxCalendar],
  template: `
    <tx-calendar
      [(value)]="value"
      [today]="today"
      [min]="min()"
      [max]="max()"
      [dateDisabled]="dateDisabled()"
      locale="en-GB"
      (dateSelect)="picked.push($event)"
    />
  `,
})
class CalendarHost {
  readonly today = TODAY;
  readonly value = signal<Date | null>(null);
  readonly min = signal<Date | null>(null);
  readonly max = signal<Date | null>(null);
  readonly dateDisabled = signal<((d: Date) => boolean) | null>(null);
  readonly picked: Date[] = [];
}

describe('TxCalendar', () => {
  let fixture: ComponentFixture<CalendarHost>;

  const grid = (): HTMLElement => fixture.nativeElement.querySelector('.tx-calendar__grid');
  const monthLabel = (): string =>
    fixture.nativeElement.querySelector('.tx-calendar__month').textContent.trim();
  const days = (): HTMLButtonElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.tx-calendar__day'));
  const dayFor = (iso: string): HTMLButtonElement => {
    const target = txParseIsoDate(iso)!;
    const dates = gridDates();
    return days().find((_, i) => txIsSameDay(dates[i], target))!;
  };
  const gridDates = (): Date[] =>
    txMonthGrid(currentMonth(), 1).flat();
  const currentMonth = (): Date => {
    // The header is the source of truth for which month is on screen.
    const [month, year] = monthLabel().split(' ');
    const index = new Date(`${month} 1, 2000`).getMonth();
    return new Date(Number(year), index, 1);
  };
  const focused = (): HTMLButtonElement | null =>
    (grid().querySelector('[tabindex="0"]') as HTMLButtonElement) ?? null;
  const press = (key: string, init: KeyboardEventInit = {}) => {
    grid().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...init }));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CalendarHost] }).compileComponents();
    fixture = TestBed.createComponent(CalendarHost);
    fixture.detectChanges();
  });

  it('opens on the month containing today when nothing is selected', () => {
    expect(monthLabel()).toBe('March 2026');
    expect(focused()!.textContent!.trim()).toBe('14');
    expect(focused()!.getAttribute('aria-current')).toBe('date');
  });

  it('renders a grid with one tab stop', () => {
    expect(grid().getAttribute('role')).toBe('grid');
    expect(fixture.nativeElement.querySelectorAll('[role="gridcell"]').length).toBe(42);
    expect(grid().querySelectorAll('[tabindex="0"]').length).toBe(1);
  });

  it('names every day in full for the accessibility tree', () => {
    expect(focused()!.getAttribute('aria-label')).toContain('14 March 2026');
  });

  it('marks the days either side of the month as outside', () => {
    const outside = days().filter((d) => d.classList.contains('tx-calendar__day--outside'));
    // March 2026 starts on a Sunday and has 31 days: 6 leading, 5 trailing.
    expect(outside.length).toBe(11);
  });

  it('selects a day and reports it', () => {
    dayFor('2026-03-20').click();
    fixture.detectChanges();

    expect(txFormatIsoDate(fixture.componentInstance.value()!)).toBe('2026-03-20');
    expect(txFormatIsoDate(fixture.componentInstance.picked[0])).toBe('2026-03-20');
    expect(
      fixture.nativeElement.querySelector('[aria-selected="true"] .tx-calendar__day').textContent.trim(),
    ).toBe('20');
  });

  it('pages months without skipping one on a 31st', () => {
    fixture.componentInstance.value.set(new Date(2026, 0, 31));
    fixture.detectChanges();
    expect(monthLabel()).toBe('January 2026');

    (fixture.nativeElement.querySelectorAll('.tx-calendar__page')[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(monthLabel()).toBe('February 2026');
  });

  it('moves a day at a time and crosses into the next month', () => {
    fixture.componentInstance.value.set(new Date(2026, 2, 31));
    fixture.detectChanges();
    expect(focused()!.textContent!.trim()).toBe('31');

    press('ArrowRight');
    expect(monthLabel()).toBe('April 2026');
    expect(focused()!.textContent!.trim()).toBe('1');

    press('ArrowLeft');
    expect(monthLabel()).toBe('March 2026');
    expect(focused()!.textContent!.trim()).toBe('31');
  });

  it('moves a week at a time', () => {
    press('ArrowDown');
    expect(focused()!.textContent!.trim()).toBe('21');
    press('ArrowUp');
    press('ArrowUp');
    expect(focused()!.textContent!.trim()).toBe('7');
  });

  it('jumps to the ends of the week', () => {
    // 14 March 2026 is a Saturday; Monday-first weeks run Mon-Sun.
    press('Home');
    expect(focused()!.textContent!.trim()).toBe('9');
    press('End');
    expect(focused()!.textContent!.trim()).toBe('15');
  });

  it('pages by month and by year from the keyboard', () => {
    press('PageDown');
    expect(monthLabel()).toBe('April 2026');
    press('PageUp');
    expect(monthLabel()).toBe('March 2026');

    press('PageDown', { shiftKey: true });
    expect(monthLabel()).toBe('March 2027');
    press('PageUp', { shiftKey: true });
    expect(monthLabel()).toBe('March 2026');
  });

  it('selects from the keyboard', () => {
    press('ArrowRight');
    press('Enter');
    expect(txFormatIsoDate(fixture.componentInstance.value()!)).toBe('2026-03-15');

    press('ArrowRight');
    press(' ');
    expect(txFormatIsoDate(fixture.componentInstance.value()!)).toBe('2026-03-16');
  });

  it('disables days outside the range and refuses to select them', () => {
    fixture.componentInstance.min.set(new Date(2026, 2, 10));
    fixture.componentInstance.max.set(new Date(2026, 2, 20));
    fixture.detectChanges();

    expect(dayFor('2026-03-09').disabled).toBe(true);
    expect(dayFor('2026-03-10').disabled).toBe(false);
    expect(dayFor('2026-03-21').disabled).toBe(true);

    dayFor('2026-03-09').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBeNull();
  });

  it('stops the cursor at the range bounds', () => {
    fixture.componentInstance.min.set(new Date(2026, 2, 13));
    fixture.componentInstance.max.set(new Date(2026, 2, 15));
    fixture.detectChanges();

    press('ArrowLeft');
    expect(focused()!.textContent!.trim()).toBe('13');
    press('ArrowLeft');
    expect(focused()!.textContent!.trim()).toBe('13');

    press('PageDown');
    expect(monthLabel()).toBe('March 2026');
    expect(focused()!.textContent!.trim()).toBe('15');
  });

  it('disables the paging buttons at the edges of the range', () => {
    fixture.componentInstance.min.set(new Date(2026, 2, 1));
    fixture.componentInstance.max.set(new Date(2026, 2, 31));
    fixture.detectChanges();

    const pages = fixture.nativeElement.querySelectorAll('.tx-calendar__page');
    expect((pages[0] as HTMLButtonElement).disabled).toBe(true);
    expect((pages[1] as HTMLButtonElement).disabled).toBe(true);
  });

  it('blocks individual days without blocking the range around them', () => {
    fixture.componentInstance.dateDisabled.set((d) => d.getDay() === 0 || d.getDay() === 6);
    fixture.detectChanges();

    expect(dayFor('2026-03-14').disabled).toBe(true); // Saturday
    expect(dayFor('2026-03-16').disabled).toBe(false); // Monday
  });

  it('still lets focus land on a blocked day, so the edge stays reachable', () => {
    fixture.componentInstance.dateDisabled.set((d) => d.getDate() === 15);
    fixture.detectChanges();

    press('ArrowRight');
    expect(focused()!.textContent!.trim()).toBe('15');
    expect(focused()!.disabled).toBe(true);
  });

  it('shows the month a trailing day belongs to when it is chosen', () => {
    const trailing = days().filter((d) => d.classList.contains('tx-calendar__day--outside'));
    const april = trailing[trailing.length - 1];
    april.click();
    fixture.detectChanges();

    expect(monthLabel()).toBe('April 2026');
  });
});

@Component({
  standalone: true,
  imports: [TxDatepicker],
  template: `
    <tx-datepicker
      label="Due"
      [(value)]="value"
      [today]="today"
      [min]="min()"
      [max]="max()"
      [clearable]="true"
      locale="en-GB"
      (parseError)="errors.push($event)"
    />
  `,
})
class PickerHost {
  readonly today = TODAY;
  readonly value = signal<Date | null>(null);
  readonly min = signal<Date | null>(null);
  readonly max = signal<Date | null>(null);
  readonly errors: (string | null)[] = [];
}

describe('TxDatepicker', () => {
  let fixture: ComponentFixture<PickerHost>;

  const field = (): HTMLInputElement =>
    fixture.nativeElement.querySelector('.tx-datepicker__field');
  const trigger = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector('.tx-datepicker__trigger');
  const panel = (): HTMLElement | null => document.querySelector('.tx-datepicker__panel');
  const type = (text: string) => {
    field().value = text;
    field().dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };
  const blur = () => {
    field().dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PickerHost] }).compileComponents();
    fixture = TestBed.createComponent(PickerHost);
    fixture.detectChanges();
  });

  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container').forEach((n) => n.remove());
  });

  it('shows the value in ISO form', () => {
    fixture.componentInstance.value.set(new Date(2026, 2, 14));
    fixture.detectChanges();
    expect(field().value).toBe('2026-03-14');
  });

  it('parses what is typed, on blur', () => {
    type('2026-04-01');
    // Not committed yet: the value would thrash while a date is half-typed.
    expect(fixture.componentInstance.value()).toBeNull();

    blur();
    expect(txFormatIsoDate(fixture.componentInstance.value()!)).toBe('2026-04-01');
  });

  it('parses on Enter too', () => {
    type('2026-04-02');
    field().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();
    expect(txFormatIsoDate(fixture.componentInstance.value()!)).toBe('2026-04-02');
  });

  it('keeps unreadable text instead of silently discarding it', () => {
    fixture.componentInstance.value.set(new Date(2026, 2, 14));
    fixture.detectChanges();

    type('2026-02-30');
    blur();

    // The old value survives, the typed text is still on screen, and the
    // problem is reported rather than swallowed.
    expect(txFormatIsoDate(fixture.componentInstance.value()!)).toBe('2026-03-14');
    expect(field().value).toBe('2026-02-30');
    expect(fixture.componentInstance.errors).toContain('2026-02-30');
    expect(fixture.nativeElement.querySelector('tx-datepicker').classList).toContain(
      'tx-datepicker--invalid',
    );
    expect(field().getAttribute('aria-invalid')).toBe('true');
  });

  it('says when a readable date is simply out of range', () => {
    fixture.componentInstance.min.set(new Date(2026, 2, 1));
    fixture.detectChanges();

    type('2026-01-05');
    blur();

    const message = fixture.nativeElement.querySelector('.tx-field__desc').textContent.trim();
    expect(message).toContain('outside the allowed range');
    expect(fixture.componentInstance.value()).toBeNull();
  });

  it('clears the value when the field is emptied', () => {
    fixture.componentInstance.value.set(new Date(2026, 2, 14));
    fixture.detectChanges();

    type('');
    expect(fixture.componentInstance.value()).toBeNull();
  });

  it('opens the panel from the trigger and from ArrowDown', () => {
    expect(panel()).toBeNull();

    trigger().click();
    fixture.detectChanges();
    expect(panel()).not.toBeNull();
    expect(panel()!.getAttribute('role')).toBe('dialog');
    expect(field().getAttribute('aria-expanded')).toBe('true');

    field().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(panel()).toBeNull();

    field().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    expect(panel()).not.toBeNull();
  });

  it('picks a date from the calendar and closes', () => {
    trigger().click();
    fixture.detectChanges();

    const days = Array.from(
      panel()!.querySelectorAll('.tx-calendar__day'),
    ) as HTMLButtonElement[];
    const twentieth = days.find(
      (d) => d.textContent!.trim() === '20' && !d.classList.contains('tx-calendar__day--outside'),
    )!;
    twentieth.click();
    fixture.detectChanges();

    expect(txFormatIsoDate(fixture.componentInstance.value()!)).toBe('2026-03-20');
    expect(panel()).toBeNull();
    expect(field().value).toBe('2026-03-20');
  });

  it('clears from the clear button', () => {
    fixture.componentInstance.value.set(new Date(2026, 2, 14));
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.tx-datepicker__clear') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBeNull();
    expect(field().value).toBe('');
  });

  it('normalises an incoming value to midnight so equality holds', () => {
    fixture.componentInstance.value.set(new Date(2026, 2, 14));
    fixture.detectChanges();
    type('2026-03-14');
    blur();

    const value = fixture.componentInstance.value()!;
    expect(value.getHours()).toBe(0);
    expect(value.getMinutes()).toBe(0);
    expect(value.getSeconds()).toBe(0);
    expect(value.getMilliseconds()).toBe(0);
  });
});

@Component({
  standalone: true,
  imports: [TxDatepicker, ReactiveFormsModule],
  template: `<tx-datepicker label="Due" [formControl]="control" [today]="today" />`,
})
class ReactiveHost {
  readonly today = TODAY;
  readonly control = new FormControl<Date | null>(null);
}

describe('TxDatepicker with reactive forms', () => {
  let fixture: ComponentFixture<ReactiveHost>;
  const field = (): HTMLInputElement =>
    fixture.nativeElement.querySelector('.tx-datepicker__field');

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ReactiveHost] }).compileComponents();
    fixture = TestBed.createComponent(ReactiveHost);
    fixture.detectChanges();
  });

  it('writes a Date down into the field', () => {
    fixture.componentInstance.control.setValue(new Date(2026, 5, 9));
    fixture.detectChanges();
    expect(field().value).toBe('2026-06-09');
  });

  it('accepts an ISO string, which is what JSON hands back', () => {
    fixture.componentInstance.control.setValue('2026-06-09' as unknown as Date);
    fixture.detectChanges();
    expect(field().value).toBe('2026-06-09');
  });

  it('pushes a typed date back up to the control', () => {
    field().value = '2026-07-04';
    field().dispatchEvent(new Event('input'));
    field().dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();

    expect(txFormatIsoDate(fixture.componentInstance.control.value!)).toBe('2026-07-04');
  });

  it('marks the control touched on blur', () => {
    expect(fixture.componentInstance.control.touched).toBe(false);
    field().dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    expect(fixture.componentInstance.control.touched).toBe(true);
  });

  it('honours a disabled control', () => {
    fixture.componentInstance.control.disable();
    fixture.detectChanges();

    expect(field().disabled).toBe(true);
    expect(
      (fixture.nativeElement.querySelector('.tx-datepicker__trigger') as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it('does not fire the control for a value it already holds', () => {
    let emissions = 0;
    fixture.componentInstance.control.valueChanges.subscribe(() => emissions++);

    fixture.componentInstance.control.setValue(txStartOfDay(new Date(2026, 2, 14)));
    fixture.detectChanges();
    const after = emissions;

    field().value = '2026-03-14';
    field().dispatchEvent(new Event('input'));
    field().dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();

    expect(emissions).toBe(after);
  });
});
