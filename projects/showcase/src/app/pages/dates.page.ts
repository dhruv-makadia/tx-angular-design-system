import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  TxButton,
  TxCalendar,
  TxCard,
  TxDatepicker,
  TxSpinner,
  txAddDays,
  txFormatIsoDate,
  txStartOfDay,
} from '@tx-angular-design-system/core';
import { ApiRow, DemoApi, DemoExample, DemoGuidance, DemoKeys, DemoPage } from '../shared/demo';

const TODAY = txStartOfDay(new Date());

@Component({
  standalone: true,
  imports: [
    DemoPage,
    DemoExample,
    DemoApi,
    DemoKeys,
    DemoGuidance,
    ReactiveFormsModule,
    TxDatepicker,
    TxCalendar,
    TxSpinner,
    TxButton,
    TxCard,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <demo-page
      heading="Dates & progress"
      lede="A date field you can type into, the calendar behind it, and a busy indicator that says
            how far along it is whenever that is actually known."
    >
      <demo-example
        heading="Datepicker"
        note="A real text input. Typing 2026-03-14 is faster than paging to it, and it is the only route for someone who cannot use a pointer."
        [code]="pickerCode"
        column
      >
        <div class="row">
          <tx-datepicker label="Due" [(value)]="due" clearable />
          <tx-datepicker label="Shipped" [(value)]="shipped" hint="Weekdays only" [dateDisabled]="isWeekend" />
        </div>
        <p class="state">
          due: <code>{{ due() ? iso(due()!) : '(none)' }}</code> · shipped:
          <code>{{ shipped() ? iso(shipped()!) : '(none)' }}</code>
        </p>
      </demo-example>

      <demo-example
        heading="What happens to what you type"
        note="Unreadable text is reported, never silently discarded."
        [code]="parseCode"
        column
      >
        <div class="row">
          <tx-datepicker
            label="Try 2026-02-30"
            [(value)]="strict"
            placeholder="yyyy-mm-dd"
            (parseError)="lastError.set($event)"
          />
        </div>
        <p class="state">
          @if (lastError(); as bad) {
            rejected <code>{{ bad }}</code> — the value is still
            <code>{{ strict() ? iso(strict()!) : '(none)' }}</code>
          } @else {
            value: <code>{{ strict() ? iso(strict()!) : '(none)' }}</code>
          }
        </p>
        <p class="prose">
          <code>2026-02-30</code> is rejected rather than rolled forward into March. A field that
          silently corrects what someone typed is worse than one that says it did not understand:
          the correction is invisible, and it is wrong about half the time. The old value survives,
          the text stays on screen, and <code>parseError</code> fires so you can decide what to do.
        </p>
      </demo-example>

      <demo-example
        heading="Ranges and blocked days"
        note="min and max bound the field; dateDisabled blocks individual days inside it."
        [code]="rangeCode"
        column
      >
        <div class="row">
          <tx-datepicker label="Within 30 days" [(value)]="soon" [min]="today" [max]="in30" />
        </div>
        <p class="prose">
          A blocked day still takes keyboard focus. Skipping it would make the edge of a range
          unreachable and would hide from a screen-reader user that the day exists at all — only
          <code>min</code> and <code>max</code> actually stop the cursor.
        </p>
      </demo-example>

      <demo-example
        heading="Calendar on its own"
        note="The same grid, always visible. Useful when the date is the page rather than a field on it."
        [code]="calendarCode"
        column
      >
        <div class="row row--top">
          <tx-card variant="outlined">
            <span slot="title">Pick a date</span>
            <tx-calendar [(value)]="inline" [dateDisabled]="isWeekend" />
          </tx-card>
          <tx-card variant="outlined">
            <span slot="title">Sunday first</span>
            <tx-calendar [(value)]="inline" [firstDayOfWeek]="0" locale="en-US" />
          </tx-card>
        </div>
        <p class="state">inline: <code>{{ inline() ? iso(inline()!) : '(none)' }}</code></p>
      </demo-example>

      <demo-example
        heading="With a form control"
        [code]="formCode"
        column
      >
        <div class="row">
          <tx-datepicker
            label="Delivery"
            [formControl]="delivery"
            [min]="today"
            [invalid]="delivery.touched && delivery.invalid"
            error="A delivery date is required"
            clearable
          />
        </div>
        <p class="state">
          value: <code>{{ delivery.value ? iso(delivery.value) : 'null' }}</code> · status:
          <code>{{ delivery.status }}</code> · touched: <code>{{ delivery.touched }}</code>
        </p>
        <p class="prose">
          The control holds a <code>Date</code> at local midnight, so two dates for the same day are
          equal. It also accepts an ISO string on the way in, because that is what comes back from
          JSON.
        </p>
      </demo-example>

      <demo-example
        heading="Spinner"
        note="Indeterminate says only “still working”. Give it a value whenever you know the proportion."
        [code]="spinnerCode"
        column
      >
        <div class="spinners">
          <div class="spinners__item">
            <tx-spinner size="sm" label="Loading" />
            <code>sm</code>
          </div>
          <div class="spinners__item">
            <tx-spinner label="Loading" />
            <code>md</code>
          </div>
          <div class="spinners__item">
            <tx-spinner size="lg" label="Loading" />
            <code>lg</code>
          </div>
          <div class="spinners__item">
            <tx-spinner [value]="progress()" label="Uploading" />
            <code>{{ progress() }}%</code>
          </div>
          <div class="spinners__item">
            <tx-spinner label="Loading results" showLabel />
            <code>showLabel</code>
          </div>
        </div>

        <div class="controls">
          <tx-button variant="outlined" size="sm" (activated)="step(-25)">−25%</tx-button>
          <tx-button variant="outlined" size="sm" (activated)="step(25)">+25%</tx-button>
        </div>

        <p class="prose">
          A determinate ring answers “how much longer”; a spinner cannot. Reach for the value
          whenever you have one. It draws in <code>currentColor</code>, so it takes the colour of
          whatever it sits in — inside a filled button it is white without being told.
        </p>
      </demo-example>

      <demo-api heading="tx-datepicker" [rows]="pickerApi" />
      <demo-api heading="tx-calendar" [rows]="calendarApi" />
      <demo-api heading="tx-spinner" [rows]="spinnerApi" />
      <demo-keys [rows]="keys" />
      <demo-guidance [dos]="dos" [donts]="donts" />
    </demo-page>
  `,
  styles: [
    `
      .row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(16rem, 100%), 1fr));
        gap: var(--tx-space-4);
        width: 100%;
      }
      .row--top {
        align-items: start;
      }
      .spinners {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--tx-space-5);
      }
      .spinners__item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--tx-space-2);
      }
      .controls {
        display: flex;
        flex-wrap: wrap;
        gap: var(--tx-space-2);
        margin-block-start: var(--tx-space-4);
      }
      .state,
      .prose {
        margin: var(--tx-space-3) 0 0;
        font-size: var(--tx-text-sm);
        color: var(--tx-color-on-surface-muted);
      }
      .prose {
        max-width: 62ch;
      }
      code {
        font-family: var(--tx-font-mono);
        font-size: 0.92em;
        color: var(--tx-color-on-surface);
      }
    `,
  ],
})
export class DatesPage {
  protected readonly today = TODAY;
  protected readonly in30 = txAddDays(TODAY, 30);

  protected readonly due = signal<Date | null>(TODAY);
  protected readonly shipped = signal<Date | null>(null);
  protected readonly strict = signal<Date | null>(null);
  protected readonly soon = signal<Date | null>(null);
  protected readonly inline = signal<Date | null>(TODAY);
  protected readonly lastError = signal<string | null>(null);

  protected readonly delivery = new FormControl<Date | null>(null, Validators.required);

  protected readonly progressRaw = signal(45);
  protected readonly progress = computed(() => this.progressRaw());

  protected readonly isWeekend = (date: Date): boolean =>
    date.getDay() === 0 || date.getDay() === 6;

  protected iso(date: Date): string {
    return txFormatIsoDate(date);
  }

  protected step(by: number): void {
    this.progressRaw.update((n) => Math.min(100, Math.max(0, n + by)));
  }

  protected readonly pickerCode = `<tx-datepicker label="Due" [(value)]="due" clearable />

<tx-datepicker
  label="Shipped"
  [(value)]="shipped"
  [dateDisabled]="isWeekend"
  hint="Weekdays only" />

isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;`;

  protected readonly parseCode = `<tx-datepicker
  label="Due"
  [(value)]="due"
  (parseError)="note.set($event)" />

// parseError fires with the text we could not read,
// then with null once the field holds something valid.`;

  protected readonly rangeCode = `<tx-datepicker
  label="Within 30 days"
  [(value)]="soon"
  [min]="today"
  [max]="in30" />`;

  protected readonly calendarCode = `<tx-calendar [(value)]="picked" [dateDisabled]="isWeekend" />

<!-- Sunday-first weeks and US month names -->
<tx-calendar [(value)]="picked" [firstDayOfWeek]="0" locale="en-US" />`;

  protected readonly formCode = `delivery = new FormControl<Date | null>(null, Validators.required);

<tx-datepicker
  label="Delivery"
  [formControl]="delivery"
  [min]="today"
  [invalid]="delivery.touched && delivery.invalid"
  error="A delivery date is required"
  clearable />`;

  protected readonly spinnerCode = `<!-- Indeterminate -->
<tx-spinner label="Loading results" />

<!-- Determinate: a ring that answers "how much longer" -->
<tx-spinner [value]="uploaded()" label="Uploading" />

<!-- Label on screen as well as in the a11y tree -->
<tx-spinner size="lg" label="Loading results" showLabel />`;

  protected readonly pickerApi: readonly ApiRow[] = [
    { name: 'value', type: 'model<Date | null>', def: 'null', description: 'The chosen day, at local midnight. Two-way bindable; also a ControlValueAccessor.' },
    { name: 'min / max', type: 'Date | null', def: 'null', description: 'Inclusive bounds. Text outside them is rejected with a range message.' },
    { name: 'dateDisabled', type: '(date: Date) => boolean', def: 'null', description: 'Blocks individual days inside the range.' },
    { name: 'formatDate', type: '(date: Date) => string', def: 'txFormatIsoDate', description: 'How the value is written into the field. Change with parseDate or not at all.' },
    { name: 'parseDate', type: '(text: string) => Date | null', def: 'txParseIsoDate', description: 'How typed text is read. Return null for anything you do not understand.' },
    { name: 'firstDayOfWeek', type: 'number', def: '1', description: '0 is Sunday.' },
    { name: 'locale', type: 'string | undefined', def: 'undefined', description: 'BCP 47 tag for month and weekday names. Defaults to the runtime locale.' },
    { name: 'today', type: 'Date', def: 'now', description: 'Overridable, so a test or a historical view can pin it.' },
    { name: 'clearable', type: 'boolean', def: 'false', description: 'Shows a clear button once there is a value.' },
    { name: 'parseError', type: 'output<string | null>', description: 'The text we could not read, then null once the field is valid again.' },
    { name: 'opened / closed', type: 'output<void>', description: 'The calendar panel opened or closed.' },
  ];

  protected readonly calendarApi: readonly ApiRow[] = [
    { name: 'value', type: 'model<Date | null>', def: 'null', description: 'The selected day, at local midnight.' },
    { name: 'min / max / dateDisabled', type: 'as above', description: 'Same bounding as the datepicker.' },
    { name: 'firstDayOfWeek', type: 'number', def: '1', description: 'Which weekday the grid starts on.' },
    { name: 'label', type: 'string', def: "'Calendar'", description: 'Accessible name for the grid.' },
    { name: 'dateSelect', type: 'output<Date>', description: 'A day was chosen.' },
    { name: 'monthChange', type: 'output<Date>', description: 'The displayed month changed.' },
  ];

  protected readonly spinnerApi: readonly ApiRow[] = [
    { name: 'value', type: 'number | null', def: 'null', description: 'Completion 0–100. null is indeterminate, which ARIA spells as a progressbar with no aria-valuenow.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", def: "'md'", description: '16, 24 or 40 px. Override with --tx-spinner-size.' },
    { name: 'label', type: 'string', def: "'Loading…'", description: 'Accessible name. Say what is loading, not that something is.' },
    { name: 'showLabel', type: 'boolean', def: 'false', description: 'Renders the label beside the ring instead of only in the a11y tree.' },
    { name: 'inline', type: 'boolean', def: 'false', description: 'Sits on the text baseline rather than as a centred block.' },
  ];

  protected readonly keys = [
    { keys: 'Enter', action: 'Commit the typed date' },
    { keys: '↓', action: 'Open the calendar from the field' },
    { keys: '← →', action: 'Previous or next day, across month boundaries' },
    { keys: '↑ ↓', action: 'Same weekday, previous or next week' },
    { keys: 'Home · End', action: 'First or last day of the week' },
    { keys: 'PageUp · PageDown', action: 'Previous or next month' },
    { keys: '⇧ PageUp · PageDown', action: 'Previous or next year' },
    { keys: 'Enter · Space', action: 'Select the focused day' },
    { keys: 'Escape', action: 'Close the calendar, keeping the value' },
  ];

  protected readonly dos = [
    'Let people type. The calendar is the second way to enter a date, not the only one.',
    'Use min and max for the bounds, dateDisabled for the exceptions inside them.',
    'Give a spinner a label that names what is loading — “Loading results”, not “Loading”.',
    'Show a determinate ring whenever you know the proportion; a spinner cannot say how much longer.',
  ];

  protected readonly donts = [
    'Do not use a locale-ambiguous default format: 03/04/2026 is two different days depending on who reads it.',
    'Do not silently correct an impossible date — say you could not read it and keep what was typed.',
    'Do not put a spinner on something that finishes in under a second; it reads as a flash of failure.',
    'Do not remove a blocked day from the grid; disable it, so its place in the month stays legible.',
  ];
}
