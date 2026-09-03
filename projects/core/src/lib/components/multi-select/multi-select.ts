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
 * A multiple-choice select that summarises its selection as chips.
 *
 * Beyond {@link TxSelect} it adds select-all, per-chip removal, and an
 * overflow summary once the selection passes `maxVisibleChips`. The panel
 * stays open while choosing, which is what separates a multi-select from a
 * select in practice.
 *
 * ```html
 * <tx-multi-select
 *   label="Regions"
 *   [options]="regions()"
 *   [(value)]="activeRegions"
 *   [maxVisibleChips]="2" />
 * ```
 *
 * ### Keyboard
 * | Key | Action |
 * | --- | --- |
 * | `Enter` / `Space` / `Alt+ArrowDown` | Open the panel |
 * | `ArrowUp` / `ArrowDown` | Move between options |
 * | `Space` / `Enter` | Toggle the active option |
 * | any character | Typeahead |
 * | `Escape` | Close the panel |
 * | `Backspace` (on trigger) | Remove the last chip |
 */
@Component({
  selector: 'tx-multi-select',
  standalone: true,
  imports: [OverlayModule, Listbox, Option],
  templateUrl: './multi-select.html',
  styleUrls: ['../../shared/field.css', './multi-select.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'tx-multi-select',
    '[class.tx-multi-select--disabled]': 'isDisabled()',
    '[class.tx-multi-select--invalid]': 'invalid()',
    '[class.tx-multi-select--open]': 'expanded()',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TxMultiSelect),
      multi: true,
    },
  ],
})
export class TxMultiSelect<V> implements ControlValueAccessor {
  private readonly config = injectTxConfig();

  readonly options = input.required<readonly TxSelectOption<V>[]>();
  readonly label = input<string>('');
  readonly placeholder = input($localize`:@@tx.multiSelect.placeholder:Select…`);
  readonly hint = input<string>('');
  readonly error = input<string>('');
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly filterable = input<boolean | 'auto'>('auto');
  readonly compareWith = input<(a: V, b: V) => boolean>(Object.is);
  readonly emptyText = input($localize`:@@tx.multiSelect.empty:No matches`);
  /** Offers a select-all / clear-all control above the list. */
  readonly selectAll = input(true, { transform: booleanAttribute });
  /** Chips shown before the rest collapse into a "+N more" summary. */
  readonly maxVisibleChips = input<number>(this.config.maxVisibleChips);

  /** The selected values. Always an array; never `null`. */
  readonly value = model<V[]>([]);

  readonly opened = output<void>();
  readonly closed = output<void>();

  protected readonly expanded = signal(false);
  protected readonly filterText = signal('');
  protected readonly cvaDisabled = signal(false);
  protected readonly id = `tx-multi-select-${nextId++}`;
  /** Let the CDK size the panel from the trigger rather than measuring it. */
  protected readonly matchTriggerWidth = this.config.panelWidth === 'trigger';

  protected readonly filterLabel = $localize`:@@tx.multiSelect.filter:Filter options`;
  protected readonly loadingLabel = $localize`:@@tx.multiSelect.loading:Loading…`;
  protected readonly selectAllLabel = $localize`:@@tx.multiSelect.selectAll:Select all`;
  protected readonly clearAllLabel = $localize`:@@tx.multiSelect.clearAll:Clear all`;

  private readonly triggerRef = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly filterRef = viewChild<ElementRef<HTMLInputElement>>('filter');
  private readonly listboxRef = viewChild<ElementRef<HTMLElement>>('listbox');

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);

  private onChange: (value: V[]) => void = () => {};
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

  /** Selected options in the order they appear in `options`, not click order. */
  protected readonly selectedOptions = computed(() => {
    const chosen = this.value();
    const same = this.compareWith();
    return this.options().filter((o) => chosen.some((v) => same(v, o.value)));
  });

  protected readonly visibleChips = computed(() => this.selectedOptions().slice(0, this.maxVisibleChips()));

  protected readonly overflowCount = computed(() =>
    Math.max(0, this.selectedOptions().length - this.maxVisibleChips()),
  );

  protected readonly overflowLabel = computed(() => {
    const count = this.overflowCount();
    return $localize`:@@tx.multiSelect.overflow:+${count}:count: more`;
  });

  protected readonly allSelected = computed(() => {
    const selectable = this.options().filter((o) => !o.disabled);
    return selectable.length > 0 && selectable.length === this.selectedOptions().length;
  });

  constructor() {
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
    if (event.key === 'Backspace' && this.value().length && !this.expanded()) {
      event.preventDefault();
      this.commit(this.value().slice(0, -1));
      return;
    }
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      this.open();
    }
  }

  protected focusList(event: Event): void {
    event.preventDefault();
    this.listboxRef()?.nativeElement.focus();
  }

  /**
   * The listbox echoes our own value back while it initialises; committing that
   * would fire spurious change events, so identical selections are ignored.
   */
  protected onListboxValue(values: V[]): void {
    const current = this.value();
    const same = this.compareWith();
    const unchanged =
      values.length === current.length && values.every((v) => current.some((c) => same(v, c)));
    if (unchanged) return;

    this.commit(values);
  }

  protected removeChip(option: TxSelectOption<V>, event: Event): void {
    event.stopPropagation();
    const same = this.compareWith();
    this.commit(this.value().filter((v) => !same(v, option.value)));
  }

  protected toggleAll(): void {
    if (this.allSelected()) {
      this.commit([]);
    } else {
      this.commit(this.options().filter((o) => !o.disabled).map((o) => o.value));
    }
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

  private commit(next: V[]): void {
    this.value.set(next);
    this.onChange(next);
  }

  // --- ControlValueAccessor ------------------------------------------------
  writeValue(value: V[] | null): void {
    this.value.set(value ?? []);
  }
  registerOnChange(fn: (value: V[]) => void): void {
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
