import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  TxButton,
  TxCard,
  TxCheckbox,
  TxIcon,
  TxInput,
  TxMultiSelect,
  TxRadioGroup,
  TxSelect,
  TxSelectOption,
  TxTable,
  TxTableColumn,
  TxTextarea,
  TxToggle,
} from '@tx-angular-design-system/core';
import { DemoPage } from '../shared/demo';
import { ThemeService } from '../theme.service';
import {
  CATALOGUE,
  CATEGORIES,
  CatalogueItem,
  STATUS_LABELS,
  SUPPLIERS,
  StockStatus,
} from '../catalogue-data';

/**
 * The composition page.
 *
 * A full working screen built only from library components. Isolated demos hide
 * awkward APIs; this is where they surface — every gap found here was fixed in
 * the library rather than worked around in the page.
 */
@Component({
  standalone: true,
  imports: [
    DemoPage,
    TxSelect,
    TxMultiSelect,
    TxTable,
    TxInput,
    TxTextarea,
    TxCheckbox,
    TxToggle,
    TxRadioGroup,
    TxButton,
    TxCard,
    TxIcon,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <demo-page
      eyebrow="In practice"
      heading="Composition"
      lede="A records screen and a multi-section form, built from library components only. No
            app-level custom components were needed."
    >
      <tx-card variant="outlined">
        <span slot="title">Filters</span>
        <span slot="subtitle">Each filter narrows the set; none of them clears the others</span>
        <div slot="header-actions">
          @if (activeFilterCount() > 0) {
            <tx-button variant="text" size="sm" (activated)="clearFilters()">
              Clear {{ activeFilterCount() }}
            </tx-button>
          }
        </div>

        <div class="filters">
          <tx-select
            label="Category"
            placeholder="All categories"
            [options]="categoryOptions"
            [(value)]="category"
            clearable
          />
          <tx-multi-select
            label="Supplier"
            placeholder="All suppliers"
            [options]="supplierOptions"
            [(value)]="suppliers"
            [maxVisibleChips]="2"
          />
          <tx-multi-select
            label="Status"
            placeholder="Any status"
            [options]="statusOptions"
            [(value)]="statuses"
            [maxVisibleChips]="2"
          />
        </div>

        <dl class="summary">
          <div>
            <dt>Matching items</dt>
            <dd>{{ rows().length }}</dd>
          </div>
          <div>
            <dt>Stock value</dt>
            <dd>{{ formatCurrency(totalValue()) }}</dd>
          </div>
          <div>
            <dt>Low or out</dt>
            <dd>{{ atRisk() }}</dd>
          </div>
        </dl>
      </tx-card>

      <tx-table
        label="Catalogue items"
        [data]="rows()"
        [columns]="columns"
        [density]="theme.density()"
        [trackBy]="trackBySku"
        (rowClick)="inspect($event)"
        paginated
        emptyText="No items match these filters"
      />

      @if (selected(); as item) {
        <tx-card variant="filled">
          <span slot="title">{{ item.name }}</span>
          <span slot="subtitle">{{ item.sku }} · {{ item.supplier }}</span>
          <div slot="header-actions">
            <tx-button variant="text" size="sm" ariaLabel="Close details" (activated)="selected.set(null)">
              <tx-icon slot="leading" name="close" size="sm" />
            </tx-button>
          </div>
          <dl class="detail">
            <div><dt>Category</dt><dd>{{ item.category }}</dd></div>
            <div><dt>On hand</dt><dd>{{ item.stock.toLocaleString('en-GB') }}</dd></div>
            <div><dt>Unit price</dt><dd>{{ item.unitPrice.toFixed(2) }}</dd></div>
            <div><dt>Status</dt><dd>{{ statusLabel(item.status) }}</dd></div>
            <div><dt>Updated</dt><dd>{{ item.updated }}</dd></div>
          </dl>
        </tx-card>
      }

      <tx-card variant="outlined">
        <span slot="title">Add an item</span>
        <span slot="subtitle">Every form control in the library, in one panel</span>

        <div class="form">
          <tx-input
            label="SKU"
            placeholder="CB-1042"
            hint="Two letters, a dash, four digits"
            error="That does not look like a SKU"
            [(value)]="draftSku"
            [invalid]="skuInvalid()"
            [maxLength]="7"
            clearable
            required
          />
          <tx-input
            label="Item name"
            placeholder="Shielded twisted pair, 4-core"
            [(value)]="draftName"
            clearable
            required
          />
          <tx-select
            label="Category"
            placeholder="Choose a category"
            [options]="categoryOptions"
            [(value)]="draftCategory"
            clearable
          />
          <tx-radio-group label="Handling" [options]="handlingOptions" [(value)]="draftHandling" />

          <div class="form__wide">
            <tx-textarea
              label="Notes"
              placeholder="Anything the warehouse should know"
              [(value)]="draftNotes"
              [minRows]="2"
              [maxRows]="8"
              [maxLength]="240"
              hint="Grows as you type"
            />
          </div>

          <div class="form__wide form__switches">
            <tx-toggle [(checked)]="draftTracked" label="Track stock levels" hint="Warn below reorder point" />
            <tx-checkbox [(checked)]="draftConfirmed" label="Details confirmed" hint="Required before saving" required />
          </div>
        </div>

        <div slot="actions" class="actions">
          <tx-button variant="filled" [disabled]="!canSave()" [loading]="saving()" (activated)="save()">
            <tx-icon slot="leading" name="check" size="sm" />
            Save item
          </tx-button>
          <tx-button variant="text" (activated)="resetDraft()">Reset</tx-button>
          <span class="actions__spacer"></span>
          <span class="actions__state">{{ canSave() ? 'Ready to save' : 'Incomplete' }}</span>
        </div>
      </tx-card>
    </demo-page>
  `,
  styles: [
    `
      .filters {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
        gap: var(--tx-space-4);
      }
      .summary {
        display: flex;
        flex-wrap: wrap;
        gap: var(--tx-space-6);
        margin: var(--tx-space-5) 0 0;
        padding-block-start: var(--tx-space-4);
        border-block-start: var(--tx-border-width) solid var(--tx-color-border);
      }
      .summary dt,
      .detail dt {
        font-family: var(--tx-font-mono);
        font-size: var(--tx-text-2xs);
        font-weight: var(--tx-weight-medium);
        letter-spacing: var(--tx-tracking-label);
        text-transform: uppercase;
        color: var(--tx-color-on-surface-muted);
      }
      .summary dd {
        margin: var(--tx-space-1) 0 0;
        font-family: var(--tx-font-mono);
        font-size: var(--tx-text-lg);
        font-variant-numeric: tabular-nums;
      }
      .detail {
        display: flex;
        flex-wrap: wrap;
        gap: var(--tx-space-6);
        margin: 0;
      }
      .detail dd {
        margin: var(--tx-space-1) 0 0;
        font-family: var(--tx-font-mono);
        font-size: var(--tx-text-sm);
        font-variant-numeric: tabular-nums;
      }
      .form {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
        gap: var(--tx-space-4);
        align-items: start;
      }
      .form__wide {
        grid-column: 1 / -1;
      }
      .form__switches {
        display: flex;
        flex-wrap: wrap;
        gap: var(--tx-space-6);
        padding-block-start: var(--tx-space-2);
        border-block-start: var(--tx-border-width) solid var(--tx-color-border);
      }
      .actions {
        display: flex;
        align-items: center;
        gap: var(--tx-space-2);
        width: 100%;
      }
      .actions__spacer {
        flex: 1;
      }
      .actions__state {
        font-family: var(--tx-font-mono);
        font-size: var(--tx-text-2xs);
        letter-spacing: var(--tx-tracking-label);
        text-transform: uppercase;
        color: var(--tx-color-on-surface-muted);
      }
    `,
  ],
})
export class CataloguePage {
  protected readonly theme = inject(ThemeService);

  protected readonly category = signal<string | null>(null);
  protected readonly suppliers = signal<string[]>([]);
  protected readonly statuses = signal<StockStatus[]>([]);
  protected readonly selected = signal<CatalogueItem | null>(null);

  protected readonly draftSku = signal('');
  protected readonly draftName = signal('');
  protected readonly draftCategory = signal<string | null>(null);
  protected readonly draftNotes = signal('');
  protected readonly draftHandling = signal<string | null>('standard');
  protected readonly draftTracked = signal(true);
  protected readonly draftConfirmed = signal(false);
  protected readonly saving = signal(false);

  protected readonly categoryOptions: readonly TxSelectOption<string>[] = CATEGORIES.map((c) => ({
    value: c,
    label: c,
  }));

  protected readonly supplierOptions: readonly TxSelectOption<string>[] = SUPPLIERS.map((s) => ({
    value: s,
    label: s,
    hint: `${CATALOGUE.filter((i) => i.supplier === s).length} items`,
  }));

  protected readonly statusOptions: readonly TxSelectOption<StockStatus>[] = (
    Object.keys(STATUS_LABELS) as StockStatus[]
  ).map((s) => ({
    value: s,
    label: STATUS_LABELS[s],
    group: s === 'discontinued' ? 'Inactive' : 'Active',
  }));

  protected readonly handlingOptions: readonly TxSelectOption<string>[] = [
    { value: 'standard', label: 'Standard', hint: 'No special handling' },
    { value: 'fragile', label: 'Fragile', hint: 'Cushioned packaging' },
    { value: 'hazmat', label: 'Hazardous', hint: 'Requires certification' },
  ];

  protected readonly columns: readonly TxTableColumn<CatalogueItem>[] = [
    { key: 'sku', header: 'SKU', variant: 'data', sortable: true, width: '7.5rem' },
    { key: 'name', header: 'Item', sortable: true },
    { key: 'category', header: 'Category', sortable: true, width: '9rem' },
    { key: 'supplier', header: 'Supplier', sortable: true, width: '11rem' },
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
    { key: 'updated', header: 'Updated', variant: 'data', sortable: true, width: '8rem' },
  ];

  protected readonly rows = computed(() => {
    const category = this.category();
    const suppliers = this.suppliers();
    const statuses = this.statuses();

    return CATALOGUE.filter((item) => {
      if (category && item.category !== category) return false;
      if (suppliers.length && !suppliers.includes(item.supplier)) return false;
      if (statuses.length && !statuses.includes(item.status)) return false;
      return true;
    });
  });

  protected readonly activeFilterCount = computed(
    () => (this.category() ? 1 : 0) + this.suppliers().length + this.statuses().length,
  );

  protected readonly totalValue = computed(() =>
    this.rows().reduce((sum, item) => sum + item.stock * item.unitPrice, 0),
  );

  protected readonly atRisk = computed(
    () => this.rows().filter((i) => i.status === 'low' || i.status === 'backorder').length,
  );

  protected readonly skuInvalid = computed(
    () => this.draftSku().length > 0 && !/^[A-Z]{2}-\d{4}$/.test(this.draftSku()),
  );

  protected readonly canSave = computed(
    () =>
      this.draftSku().length > 0 &&
      !this.skuInvalid() &&
      this.draftName().trim().length > 0 &&
      this.draftConfirmed(),
  );

  protected readonly trackBySku = (row: CatalogueItem): string => row.sku;

  protected statusLabel(status: StockStatus): string {
    return STATUS_LABELS[status];
  }

  protected inspect(item: CatalogueItem): void {
    this.selected.set(item);
  }

  protected clearFilters(): void {
    this.category.set(null);
    this.suppliers.set([]);
    this.statuses.set([]);
  }

  protected save(): void {
    this.saving.set(true);
    setTimeout(() => this.saving.set(false), 900);
  }

  protected resetDraft(): void {
    this.draftSku.set('');
    this.draftName.set('');
    this.draftCategory.set(null);
    this.draftNotes.set('');
    this.draftHandling.set('standard');
    this.draftTracked.set(true);
    this.draftConfirmed.set(false);
  }

  protected formatCurrency(value: number): string {
    return value.toLocaleString('en-GB', { maximumFractionDigits: 0 });
  }
}
