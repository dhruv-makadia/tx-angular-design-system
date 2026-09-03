import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  TxDensity,
  TxPageState,
  TxSortState,
  TxTable,
  TxTableColumn,
} from '@tx-angular-design-system/core';
import { ApiRow, DemoApi, DemoExample, DemoGuidance, DemoKeys, DemoPage } from '../shared/demo';
import { CATALOGUE, CatalogueItem, STATUS_LABELS } from '../catalogue-data';

@Component({
  standalone: true,
  imports: [DemoPage, DemoExample, DemoApi, DemoKeys, DemoGuidance, TxTable],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <demo-page
      heading="Table"
      lede="Columns are declared as data, so a table is described rather than assembled. Sorting and
            pagination work on the array you pass in, or defer entirely to your server."
    >
      <demo-example
        heading="Sorting and pagination"
        note="Click a header to cycle ascending, descending, unsorted. Type a page number to jump."
        [code]="basicCode"
        column
      >
        <tx-table
          label="Catalogue"
          [data]="rows"
          [columns]="columns"
          [trackBy]="trackBySku"
          [(sort)]="sort"
          [(page)]="page"
          paginated
        />
        <p class="state">
          sort: <code>{{ sort().column ?? 'none' }} {{ sort().direction ?? '' }}</code> · page:
          <code>{{ page().pageIndex + 1 }}</code> · size: <code>{{ page().pageSize }}</code>
        </p>
      </demo-example>

      <demo-example
        heading="Column definitions"
        note="variant switches typography, not layout: data and numeric use the mono face with tabular figures, which is what keeps a column aligned."
        [code]="columnCode"
        column
      >
        <p class="prose">
          <code>value</code> derives a display value without changing the underlying row, so
          formatting stays out of the template and sorting still sees what the user sees.
        </p>
      </demo-example>

      <demo-example heading="Density" [code]="densityCode" column>
        <div class="density-picker" role="group" aria-label="Density">
          @for (option of densities; track option) {
            <button
              type="button"
              [class.active]="density() === option"
              [attr.aria-pressed]="density() === option"
              (click)="density.set(option)"
            >
              {{ option }}
            </button>
          }
        </div>
        <tx-table
          label="Density preview"
          [data]="preview"
          [columns]="columns"
          [density]="density()"
          [trackBy]="trackBySku"
        />
      </demo-example>

      <demo-example heading="Empty and loading states" column>
        <div class="states">
          <tx-table label="Empty" [data]="[]" [columns]="columns" emptyText="No items match these filters" />
          <tx-table label="Loading" [data]="[]" [columns]="columns" [loading]="true" />
        </div>
      </demo-example>

      <demo-example
        heading="Server-side mode"
        note="With serverSide the table renders exactly what you give it. sortChange and pageChange still fire; total supplies the row count."
        [code]="serverCode"
        column
      >
        <p class="prose">
          Client mode copies before sorting, so the array you own is never mutated. Sorting is
          null-safe and type-aware: numbers numerically, dates by timestamp, everything else through
          <code>localeCompare</code> with numeric collation.
        </p>
      </demo-example>

      <demo-api heading="tx-table" [rows]="tableApi" />
      <demo-api heading="tx-paginator" [rows]="paginatorApi" />
      <demo-keys [rows]="keys" />
      <demo-guidance [dos]="dos" [donts]="donts" />
    </demo-page>
  `,
  styles: [
    `
      .state,
      .prose {
        max-width: 62ch;
        margin: var(--tx-space-3) 0 0;
        font-size: var(--tx-text-sm);
        color: var(--tx-color-on-surface-muted);
      }
      .prose {
        margin: 0;
      }
      code {
        font-family: var(--tx-font-mono);
        font-size: 0.92em;
        color: var(--tx-color-on-surface);
      }
      .density-picker {
        display: inline-flex;
        gap: var(--tx-space-1);
        margin-block-end: var(--tx-space-3);
      }
      .density-picker button {
        padding: var(--tx-space-1) var(--tx-space-3);
        font-family: var(--tx-font-mono);
        font-size: var(--tx-text-2xs);
        letter-spacing: var(--tx-tracking-label);
        text-transform: uppercase;
        color: var(--tx-color-on-surface-muted);
        background-color: var(--tx-color-surface-raised);
        border: var(--tx-border-width) solid var(--tx-color-border);
        border-radius: var(--tx-radius-sm);
        cursor: pointer;
      }
      .density-picker button.active {
        color: var(--tx-color-accent);
        background-color: var(--tx-color-accent-subtle);
        border-color: var(--tx-color-accent-muted);
      }
      .density-picker button:focus-visible {
        outline: var(--tx-border-width-thick) solid var(--tx-color-focus);
        outline-offset: 1px;
      }
      .states {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
        gap: var(--tx-space-4);
        width: 100%;
      }
    `,
  ],
})
export class TablePage {
  protected readonly rows = CATALOGUE;
  protected readonly preview = CATALOGUE.slice(0, 4);
  protected readonly densities: readonly TxDensity[] = ['compact', 'standard', 'comfortable'];
  protected readonly density = signal<TxDensity>('standard');

  protected readonly sort = signal<TxSortState>({ column: null, direction: null });
  protected readonly page = signal<TxPageState>({ pageIndex: 0, pageSize: 10 });

  protected readonly trackBySku = (row: CatalogueItem): string => row.sku;

  protected readonly columns: readonly TxTableColumn<CatalogueItem>[] = [
    { key: 'sku', header: 'SKU', variant: 'data', sortable: true, width: '7.5rem' },
    { key: 'name', header: 'Item', sortable: true },
    { key: 'category', header: 'Category', sortable: true, width: '9rem' },
    {
      key: 'stock',
      header: 'On hand',
      variant: 'numeric',
      align: 'end',
      sortable: true,
      width: '7rem',
      value: (row) => row.stock.toLocaleString('en-GB'),
    },
    {
      key: 'unitPrice',
      header: 'Unit price',
      variant: 'numeric',
      align: 'end',
      sortable: true,
      width: '8rem',
      value: (row) => row.unitPrice.toFixed(2),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: '9rem',
      value: (row) => STATUS_LABELS[row.status],
    },
  ];

  protected readonly basicCode = `<tx-table
  label="Catalogue"
  [data]="rows()"
  [columns]="columns"
  [trackBy]="trackBySku"
  [(sort)]="sort"
  [(page)]="page"
  paginated />`;

  protected readonly columnCode = `columns: TxTableColumn<Item>[] = [
  { key: 'sku',  header: 'SKU',  variant: 'data',    sortable: true, width: '7.5rem' },
  { key: 'name', header: 'Item', sortable: true },
  { key: 'stock', header: 'On hand',
    variant: 'numeric', align: 'end', sortable: true,
    value: (row) => row.stock.toLocaleString('en-GB') },
];`;

  protected readonly densityCode = `<tx-table [data]="rows()" [columns]="columns" density="compact" />

<!-- or on any ancestor -->
<div class="tx-density-compact"> … </div>`;

  protected readonly serverCode = `<tx-table
  [data]="pageOfRows()"
  [columns]="columns"
  [total]="totalCount()"
  (sortChange)="reload($event, page())"
  (pageChange)="reload(sort(), $event)"
  serverSide
  paginated />`;

  protected readonly tableApi: readonly ApiRow[] = [
    { name: 'data', type: 'readonly T[]', description: 'Rows. Already sorted and sliced when serverSide is set.' },
    { name: 'columns', type: 'TxTableColumn<T>[]', description: 'Column definitions: key, header, sortable, align, variant, width, value, hidden.' },
    { name: 'sort', type: 'model<TxSortState>', def: '{ column: null, direction: null }', description: 'Two-way bindable. Emits sortChange.' },
    { name: 'page', type: 'model<TxPageState>', def: '{ pageIndex: 0, pageSize: 25 }', description: 'Two-way bindable. Emits pageChange.' },
    { name: 'paginated', type: 'boolean', def: 'false', description: 'Shows the paginator and slices the rows.' },
    { name: 'serverSide', type: 'boolean', def: 'false', description: 'Stops sorting and slicing; events still fire.' },
    { name: 'total', type: 'number | null', def: 'null', description: 'Row count for server-side pagination.' },
    { name: 'density', type: "'compact' | 'standard' | 'comfortable'", def: "'standard'", description: '34, 44 or 52 px rows.' },
    { name: 'stickyHeader', type: 'boolean', def: 'true', description: 'Keeps the header visible while the body scrolls.' },
    { name: 'trackBy', type: '(row: T, i: number) => unknown', def: 'row => row', description: 'Identity for @for. Use a stable id so rows survive re-sorting.' },
    { name: 'rowClick', type: 'output<T>', description: 'Fires when a row is clicked.' },
  ];

  protected readonly paginatorApi: readonly ApiRow[] = [
    { name: 'length', type: 'number', description: 'Total rows across all pages.' },
    { name: 'page', type: 'model<TxPageState>', description: 'Two-way bindable page index and size.' },
    { name: 'pageSizeOptions', type: 'readonly number[]', def: '[10, 25, 50, 100]', description: 'Hidden when only one size is offered.' },
    { name: 'showPageInput', type: 'boolean', def: 'true', description: 'The type-a-page-number field.' },
    { name: 'showRange', type: 'boolean', def: 'true', description: 'The “n–m of t” summary.' },
  ];

  protected readonly keys = [
    { keys: 'Tab', action: 'Move to a sortable header, then into the paginator' },
    { keys: 'Enter · Space', action: 'Cycle a column: ascending → descending → unsorted' },
    { keys: 'Enter', action: 'Jump to the typed page number' },
    { keys: '↑ ↓', action: 'Step one page, in the page field' },
    { keys: 'Escape', action: 'Abandon a page-number edit' },
  ];

  protected readonly dos = [
    'Give every table a label — it is the accessible name.',
    'Use a stable trackBy so rows are not rebuilt on every sort.',
    'Mark identifiers and measurements as data or numeric so columns align.',
    'Switch to serverSide before the dataset outgrows the browser, not after.',
  ];

  protected readonly donts = [
    'Do not put more than about seven columns on screen; hide the rest.',
    'Do not make the whole row clickable and also put buttons in it.',
    'Do not sort on a formatted string when the underlying value is a number or date.',
    'Do not paginate a list of five things.',
  ];
}
