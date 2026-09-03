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
import { Listbox, Option } from '@angular/aria/listbox';
import { TxSelectOption } from '../../utils/types';
import { injectTxConfig } from '../../tokens/design-system-config';

let nextId = 0;

/**
 * A single-choice select.
 *
 * Keyboard and list semantics come from Angular Aria's `ngListbox`, so
 * roving focus, typeahead and `aria-activedescendant` are handled for us;
 * positioning comes from the CDK overlay.
 *
 * Integrates with both form systems:
 * - reactive forms, via `ControlValueAccessor`
 * - Signal Forms, via the structural `FormValueControl<V | null>` contract
 *   (a `value` model plus the optional `disabled`/`readonly` inputs)
 *
 * ```html
 * <tx-select
 *   label="Owner"
 *   [options]="owners()"
 *   [(value)]="selectedOwner"
 *   clearable />
 * ```
 *
 * ### Keyboard
 * | Key | Action |
 * | --- | --- |
 * | `Enter` / `Space` / `Alt+ArrowDown` | Open the panel |
 * | `ArrowUp` / `ArrowDown` | Move between options |
 * | `Home` / `End` | First / last option |
 * | any character | Typeahead |
 * | `Enter` | Commit the active option |
 * | `Escape` | Close without committing |
 */
@Component({
  selector: 'tx-select',
  standalone: true,
  imports: [OverlayModule, Listbox, Option],
  templateUrl: './select.html',
  styleUrls: ['../../shared/field.css', './select.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'tx-select',
    '[class.tx-select--disabled]': 'isDisabled()',
    '[class.tx-select--invalid]': 'invalid()',
    '[class.tx-select--open]': 'expanded()',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TxSelect),
      multi: true,
    },
  ],
})
export class TxSelect<V> implements ControlValueAccessor {
  private readonly config = injectTxConfig();

  /** Options to choose from. */
  readonly options = input.required<readonly TxSelectOption<V>[]>();
  /** Visible field label. Also the accessible name of the trigger. */
  readonly label = input<string>('');
  /**
   * Accessible name when there is no visible label — a select inside a toolbar
   * or a paginator, for instance. Ignored when `label` is set.
   */
  readonly ariaLabel = input<string>('');
  /** Shown on the trigger when nothing is selected. */
  readonly placeholder = input($localize`:@@tx.select.placeholder:Select…`);
  /** Helper text under the field. Replaced by `error` when invalid. */
  readonly hint = input<string>('');
  /** Error text. Presence does not imply invalid; set `invalid` too. */
  readonly error = input<string>('');
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  /** Shows a clear affordance once a value is set. */
  readonly clearable = input(false, { transform: booleanAttribute });
  /** Replaces the option list with a loading message. */
  readonly loading = input(false, { transform: booleanAttribute });
  /**
   * Shows the filter field. Defaults to automatic: visible once the option
   * count passes the configured `filterThreshold`.
   */
  readonly filterable = input<boolean | 'auto'>('auto');
  /** Equality used to match `value` against an option. */
  readonly compareWith = input<(a: V, b: V) => boolean>(Object.is);
  /** Message shown when the filter matches nothing. */
  readonly emptyText = input($localize`:@@tx.select.empty:No matches`);

  /** The selected value, or `null`. Two-way bindable. */
  readonly value = model<V | null>(null);

  readonly opened = output<void>();
  readonly closed = output<void>();

  protected readonly expanded = signal(false);
  protected readonly filterText = signal('');
  protected readonly cvaDisabled = signal(false);
  protected readonly id = `tx-select-${nextId++}`;

  /** Built-in strings, extractable with `ng extract-i18n`. */
  protected readonly clearLabel = $localize`:@@tx.select.clear:Clear selection`;
  protected readonly filterLabel = $localize`:@@tx.select.filter:Filter options`;
  protected readonly loadingLabel = $localize`:@@tx.select.loading:Loading…`;

  private readonly triggerRef = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly filterRef = viewChild<ElementRef<HTMLInputElement>>('filter');
  private readonly listboxRef = viewChild<ElementRef<HTMLElement>>('listbox');

  /** Let the CDK size the panel from the trigger rather than measuring it. */
  protected readonly matchTriggerWidth = this.config.panelWidth === 'trigger';

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);

  private onChange: (value: V | null) => void = () => {};
  private onTouched: () => void = () => {};

  protected readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());

  protected readonly showFilter = computed(() => {
    const mode = this.filterable();
    return mode === 'auto' ? this.options().length >= this.config.filterThreshold : mode;
  });

  protected readonly filtered = computed(() => {
    const needle = this.filterText().trim().toLowerCase();
    const all = this.options();
    if (!needle) return all;
    return all.filter((o) => o.label.toLowerCase().includes(needle));
  });

  /** Options bucketed by `group`, preserving declaration order. */
  protected readonly groups = computed(() => {
    const buckets = new Map<string, TxSelectOption<V>[]>();
    for (const option of this.filtered()) {
      const key = option.group ?? '';
      const bucket = buckets.get(key);
      if (bucket) bucket.push(option);
      else buckets.set(key, [option]);
    }
    return [...buckets].map(([name, options]) => ({ name, options }));
  });

  protected readonly selected = computed(() => {
    const current = this.value();
    if (current === null || current === undefined) return null;
    const same = this.compareWith();
    return this.options().find((o) => same(o.value, current)) ?? null;
  });

  protected readonly displayText = computed(() => this.selected()?.label ?? '');

  /** Aria's Listbox models selection as an array even in single mode. */
  protected readonly listboxValue = computed<V[]>(() => {
    const current = this.value();
    return current === null || current === undefined ? [] : [current];
  });

  constructor() {
    // Move focus into the panel once it is actually in the DOM.
    effect(() => {
      if (!this.expanded()) return;
      queueMicrotask(() => {
        const target = this.showFilter() ? this.filterRef()?.nativeElement : this.listboxRef()?.nativeElement;
        target?.focus();
      });
    });
  }

  protected open(): void {
    if (this.isDisabled() || this.readonly() || this.expanded()) return;
    this.filterText.set('');
    this.expanded.set(true);
    this.opened.emit();
  }

  /** Hands keyboard control from the filter field to the listbox. */
  protected focusList(event: Event): void {
    event.preventDefault();
    this.listboxRef()?.nativeElement.focus();
  }

  protected close(refocus = true): void {
    if (!this.expanded()) return;
    this.expanded.set(false);
    this.onTouched();
    this.closed.emit();
    if (refocus) this.triggerRef().nativeElement.focus();
  }

  protected toggle(): void {
    this.expanded() ? this.close() : this.open();
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.open();
    }
  }

  /**
   * Aria's Listbox emits the full selection array; single mode takes the head.
   *
   * The listbox also emits once while it initialises, echoing back the value we
   * just gave it. Committing that echo would close the panel the instant it
   * opened, so anything equal to the current value is ignored.
   */
  protected onListboxValue(values: V[]): void {
    const next = values.length ? values[values.length - 1] : null;
    const current = this.value();
    const same = this.compareWith();
    const unchanged =
      next === null || next === undefined
        ? current === null || current === undefined
        : current !== null && current !== undefined && same(next, current);
    if (unchanged) return;

    this.commit(next);
    this.close();
  }

  protected clear(event: Event): void {
    event.stopPropagation();
    this.commit(null);
  }

  /**
   * Closes on a click outside the panel. Clicks on our own trigger are ignored:
   * the click that opens the panel also reaches this handler, and closing there
   * would make the panel appear not to open at all.
   */
  protected onOutsideClick(event: MouseEvent): void {
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

  private commit(next: V | null): void {
    this.value.set(next);
    this.onChange(next);
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

/** Mirrors Angular's own boolean coercion without pulling in the CDK. */
function booleanAttribute(value: unknown): boolean {
  return value != null && `${value}` !== 'false';
}
