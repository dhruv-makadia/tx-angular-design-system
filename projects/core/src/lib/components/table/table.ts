import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';
import { TxPaginator } from './paginator';
import { TxDensity, injectTxConfig } from '../../tokens/design-system-config';
import { TxPageState, TxSortDirection, TxSortState, TxTableColumn } from '../../utils/types';

/**
 * A data table with sorting and pagination.
 *
 * Columns are declared as data, so a table is described rather than assembled:
 *
 * ```ts
 * columns: TxTableColumn<Release>[] = [
 *   { key: 'ref',     header: 'Reference', variant: 'data', sortable: true },
 *   { key: 'name',    header: 'Name',                       sortable: true },
 *   { key: 'size',    header: 'Size',      variant: 'numeric', align: 'end',
 *     value: (r) => r.bytes / 1024 },
 * ];
 * ```
 *
 * ```html
 * <tx-table [data]="rows()" [columns]="columns" paginated />
 * ```
 *
 * ### Client vs server
 * By default the table sorts and slices the array it is given. Set
 * `serverSide` and it stops touching the data: `sortChange` and `pageChange`
 * still fire, `data` is rendered as supplied, and `total` supplies the row
 * count for pagination.
 *
 * ### Keyboard
 * Sortable headers are buttons: `Tab` reaches them, `Enter`/`Space` cycles
 * ascending → descending → unsorted. The active column is exposed through
 * `aria-sort`.
 */
@Component({
  selector: 'tx-table',
  standalone: true,
  imports: [TxPaginator],
  templateUrl: './table.html',
  styleUrl: './table.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'tx-table',
    '[class.tx-density-compact]': "density() === 'compact'",
    '[class.tx-density-comfortable]': "density() === 'comfortable'",
  },
})
export class TxTable<T> {
  private readonly config = injectTxConfig();

  /** Rows to render. Already sorted and sliced when `serverSide` is set. */
  readonly data = input.required<readonly T[]>();
  readonly columns = input.required<readonly TxTableColumn<T>[]>();

  /** Accessible name for the table. */
  readonly label = input<string>('');
  readonly caption = input<string>('');
  readonly density = input<TxDensity>(this.config.density);
  /** Keeps the header visible while the body scrolls. */
  readonly stickyHeader = input(true, { transform: booleanAttribute });
  readonly paginated = input(false, { transform: booleanAttribute });
  /** Defers sorting and slicing to the caller. */
  readonly serverSide = input(false, { transform: booleanAttribute });
  /** Total row count. Required when `serverSide` and `paginated` are both set. */
  readonly total = input<number | null>(null);
  readonly loading = input(false, { transform: booleanAttribute });
  readonly emptyText = input($localize`:@@tx.table.empty:Nothing to show`);
  readonly pageSizeOptions = input<readonly number[]>(this.config.pageSizeOptions);
  /** Identity for `@for` tracking. Defaults to the row reference. */
  readonly trackBy = input<(row: T, index: number) => unknown>((row) => row);

  readonly sort = model<TxSortState>({ column: null, direction: null });
  readonly page = model<TxPageState>({ pageIndex: 0, pageSize: this.config.pageSize });

  /** `sort` and `page` are models: assigning them emits sortChange/pageChange. */
  readonly rowClick = output<T>();

  protected readonly loadingLabel = $localize`:@@tx.table.loading:Loading…`;

  protected readonly visibleColumns = computed(() => this.columns().filter((c) => !c.hidden));

  private readonly sorted = computed(() => {
    const rows = this.data();
    const { column, direction } = this.sort();
    if (this.serverSide() || !column || !direction) return rows;

    const def = this.visibleColumns().find((c) => c.key === column);
    if (!def) return rows;

    const factor = direction === 'asc' ? 1 : -1;
    // Copy first: sorting the caller's array in place is a nasty surprise.
    return [...rows].sort((a, b) => factor * compare(this.cellValue(def, a), this.cellValue(def, b)));
  });

  /** Row count pagination should describe. */
  protected readonly length = computed(() =>
    this.serverSide() ? (this.total() ?? this.data().length) : this.sorted().length,
  );

  protected readonly rows = computed(() => {
    const rows = this.sorted();
    if (!this.paginated() || this.serverSide()) return rows;
    const { pageIndex, pageSize } = this.page();
    const start = pageIndex * pageSize;
    return rows.slice(start, start + pageSize);
  });

  protected readonly isEmpty = computed(() => !this.loading() && this.rows().length === 0);

  protected cellValue(column: TxTableColumn<T>, row: T): unknown {
    return column.value ? column.value(row) : (row as Record<string, unknown>)[column.key];
  }

  protected ariaSort(column: TxTableColumn<T>): 'ascending' | 'descending' | 'none' | null {
    if (!this.isSortable(column)) return null;
    const { column: active, direction } = this.sort();
    if (active !== column.key || !direction) return 'none';
    return direction === 'asc' ? 'ascending' : 'descending';
  }

  protected isSortable(column: TxTableColumn<T>): boolean {
    return column.sortable === true;
  }

  protected sortDirectionOf(column: TxTableColumn<T>): TxSortDirection {
    const { column: active, direction } = this.sort();
    return active === column.key ? direction : null;
  }

  /** Cycles ascending → descending → unsorted. */
  protected toggleSort(column: TxTableColumn<T>): void {
    if (!this.isSortable(column)) return;
    const current = this.sortDirectionOf(column);
    const direction: TxSortDirection = current === null ? 'asc' : current === 'asc' ? 'desc' : null;
    const next: TxSortState = { column: direction ? column.key : null, direction };
    this.sort.set(next);
    // A new ordering invalidates the current offset.
    if (this.paginated() && this.page().pageIndex !== 0) {
      this.onPage({ ...this.page(), pageIndex: 0 });
    }
  }

  protected onPage(next: TxPageState): void {
    this.page.set(next);
  }

  protected onRowClick(row: T): void {
    this.rowClick.emit(row);
  }

  protected trackRow = (index: number, row: T): unknown => this.trackBy()(row, index);
}

/** Null-safe, type-aware comparison used by client-side sorting. */
function compare(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;

  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);

  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

function booleanAttribute(value: unknown): boolean {
  return value != null && `${value}` !== 'false';
}
