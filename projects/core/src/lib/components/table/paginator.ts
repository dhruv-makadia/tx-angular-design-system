import { ChangeDetectionStrategy, Component, computed, input, model, signal } from '@angular/core';
import { TxSelect } from '../select/select';
import { TxPageState, TxSelectOption } from '../../utils/types';
import { injectTxConfig } from '../../tokens/design-system-config';

/**
 * Page controls. Usable on its own or via {@link TxTable}'s `paginated` input.
 *
 * The component owns no data — it reports intent through `page` and lets the
 * caller decide whether to slice locally or refetch.
 *
 * The page-size control is a {@link TxSelect}, not a native `<select>`, so it
 * matches the rest of the system in both themes rather than falling back to the
 * operating system's own widget.
 *
 * ```html
 * <tx-paginator [length]="total()" [(page)]="page" />
 * ```
 *
 * ### Keyboard
 * | Key | Action |
 * | --- | --- |
 * | `Tab` | Page size, then the page field, then the arrows |
 * | `Enter` (in the page field) | Jump to that page |
 * | `ArrowUp` / `ArrowDown` (in the page field) | Step one page |
 * | `Escape` (in the page field) | Abandon the edit |
 */
@Component({
  selector: 'tx-paginator',
  standalone: true,
  imports: [TxSelect],
  templateUrl: './paginator.html',
  styleUrl: './paginator.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'tx-paginator' },
})
export class TxPaginator {
  private readonly config = injectTxConfig();

  /** Total number of rows across all pages. */
  readonly length = input.required<number>();
  /** Page-size choices. The control is hidden when only one is offered. */
  readonly pageSizeOptions = input<readonly number[]>(this.config.pageSizeOptions);
  /** Hides the "n–m of t" summary. */
  readonly showRange = input(true);
  /** Hides the type-a-page-number field, leaving only the arrows. */
  readonly showPageInput = input(true);

  /** Current page. Two-way bindable. */
  readonly page = model<TxPageState>({ pageIndex: 0, pageSize: this.config.pageSize });

  protected readonly firstLabel = $localize`:@@tx.paginator.first:First page`;
  protected readonly prevLabel = $localize`:@@tx.paginator.previous:Previous page`;
  protected readonly nextLabel = $localize`:@@tx.paginator.next:Next page`;
  protected readonly lastLabel = $localize`:@@tx.paginator.last:Last page`;
  protected readonly sizeLabel = $localize`:@@tx.paginator.pageSize:Rows per page`;
  protected readonly pageLabel = $localize`:@@tx.paginator.pageNumber:Page number`;
  protected readonly navLabel = $localize`:@@tx.paginator.navigation:Pagination`;

  /** What the user has typed, or null when the field is not being edited. */
  protected readonly draft = signal<string | null>(null);

  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.length() / Math.max(1, this.page().pageSize))),
  );

  protected readonly sizeChoices = computed<readonly TxSelectOption<number>[]>(() =>
    this.pageSizeOptions().map((size) => ({ value: size, label: String(size) })),
  );

  protected readonly rangeStart = computed(() =>
    this.length() === 0 ? 0 : this.page().pageIndex * this.page().pageSize + 1,
  );

  protected readonly rangeEnd = computed(() =>
    Math.min(this.length(), (this.page().pageIndex + 1) * this.page().pageSize),
  );

  protected readonly rangeLabel = computed(() => {
    const start = this.rangeStart();
    const end = this.rangeEnd();
    const total = this.length();
    return $localize`:@@tx.paginator.range:${start}:start: – ${end}:end: of ${total}:total:`;
  });

  /** The field shows the live page unless the user is mid-edit. */
  protected readonly pageFieldValue = computed(
    () => this.draft() ?? String(this.page().pageIndex + 1),
  );

  protected readonly isFirst = computed(() => this.page().pageIndex === 0);
  protected readonly isLast = computed(() => this.page().pageIndex >= this.pageCount() - 1);

  protected goto(pageIndex: number): void {
    const clamped = Math.min(Math.max(0, pageIndex), this.pageCount() - 1);
    this.draft.set(null);
    if (clamped === this.page().pageIndex) return;
    this.page.set({ ...this.page(), pageIndex: clamped });
  }

  protected onPageSize(size: number | null): void {
    if (size === null || !Number.isFinite(size) || size <= 0) return;
    // Keep the first visible row on screen across a page-size change.
    const anchor = this.page().pageIndex * this.page().pageSize;
    this.page.set({ pageIndex: Math.floor(anchor / size), pageSize: size });
  }

  protected onPageInput(raw: string): void {
    // Digits only, so a stray letter cannot silently become NaN.
    this.draft.set(raw.replace(/[^\d]/g, ''));
  }

  /** Applies the typed page. An empty or out-of-range entry snaps back. */
  protected commitPage(): void {
    const raw = this.draft();
    if (raw === null) return;

    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed)) {
      this.draft.set(null);
      return;
    }
    this.goto(parsed - 1);
  }

  protected onPageKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        this.commitPage();
        break;
      case 'Escape':
        event.preventDefault();
        this.draft.set(null);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.goto(this.page().pageIndex + 1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.goto(this.page().pageIndex - 1);
        break;
      default:
        break;
    }
  }
}
