import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TxMultiSelect, TxSelect, TxSelectOption } from '@tx-angular-design-system/core';
import { ApiRow, DemoApi, DemoExample, DemoGuidance, DemoKeys, DemoPage } from '../shared/demo';
import { CATALOGUE, CATEGORIES, SUPPLIERS } from '../catalogue-data';

const SUPPLIER_OPTIONS: readonly TxSelectOption<string>[] = SUPPLIERS.map((s) => ({
  value: s,
  label: s,
  hint: `${CATALOGUE.filter((i) => i.supplier === s).length} items`,
}));

const GROUPED: readonly TxSelectOption<string>[] = [
  { value: 'draft', label: 'Draft', group: 'Open' },
  { value: 'review', label: 'In review', group: 'Open' },
  { value: 'approved', label: 'Approved', group: 'Closed' },
  { value: 'archived', label: 'Archived', group: 'Closed', disabled: true },
];

const MANY: readonly TxSelectOption<string>[] = CATALOGUE.slice(0, 30).map((item) => ({
  value: item.sku,
  label: `${item.sku} · ${item.name}`,
}));

@Component({
  standalone: true,
  imports: [DemoPage, DemoExample, DemoApi, DemoKeys, DemoGuidance, TxSelect, TxMultiSelect],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <demo-page
      heading="Selects"
      lede="List semantics and keyboard behaviour come from Angular Aria's listbox — roving focus,
            typeahead and aria-activedescendant are the framework's job. Positioning is the CDK's."
    >
      <demo-example heading="Single select" [code]="singleCode" column>
        <div class="grid">
          <tx-select label="Category" placeholder="All categories" [options]="categories" [(value)]="category" clearable />
          <tx-select label="Supplier" placeholder="Choose one" [options]="suppliers" [(value)]="supplier" />
          <tx-select label="Disabled" [options]="categories" [disabled]="true" placeholder="Not available" />
        </div>
      </demo-example>

      <demo-example
        heading="Grouped and disabled options"
        note="Options carry their own group heading and disabled flag; no wrapper markup is needed."
        [code]="groupCode"
        column
      >
        <div class="grid">
          <tx-select label="Status" [options]="grouped" [(value)]="status" clearable />
        </div>
      </demo-example>

      <demo-example
        heading="Filtering"
        note="A filter field appears automatically past filterThreshold options — eight by default — or force it with [filterable]."
        [code]="filterCode"
        column
      >
        <div class="grid">
          <tx-select label="Item (30 options)" [options]="many" [(value)]="item" clearable />
          <tx-select label="Always filterable" [options]="categories" [filterable]="true" [(value)]="category" />
          <tx-select label="Loading" [options]="[]" [loading]="true" placeholder="Fetching" />
        </div>
      </demo-example>

      <demo-example heading="Multi select" [code]="multiCode" column>
        <div class="grid">
          <tx-select label="Single, for comparison" [options]="suppliers" [(value)]="supplier" clearable />
          <tx-multi-select label="Suppliers" [options]="suppliers" [(value)]="chosen" [maxVisibleChips]="2" hint="Chips collapse past two" />
          <tx-multi-select label="Status" [options]="grouped" [(value)]="statuses" [maxVisibleChips]="3" />
        </div>
        <p class="state">selected: <code>{{ chosen().length ? chosen().join(', ') : '(none)' }}</code></p>
      </demo-example>

      <demo-example
        heading="Validation"
        note="The same hint and error contract as every other form control."
        column
      >
        <div class="grid">
          <tx-select
            label="Category"
            [options]="categories"
            [(value)]="required"
            [invalid]="required() === null"
            hint="Pick the closest match"
            error="A category is required"
            required
          />
        </div>
      </demo-example>

      <demo-api heading="tx-select" [rows]="selectApi" />
      <demo-api heading="tx-multi-select (additions)" [rows]="multiApi" />
      <demo-keys [rows]="keys" />
      <demo-guidance [dos]="dos" [donts]="donts" />
    </demo-page>
  `,
  styles: [
    `
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
        gap: var(--tx-space-4);
        width: 100%;
      }
      .state {
        margin: var(--tx-space-3) 0 0;
        font-size: var(--tx-text-xs);
        color: var(--tx-color-on-surface-muted);
      }
      code {
        font-family: var(--tx-font-mono);
        font-size: 0.92em;
        color: var(--tx-color-on-surface);
      }
    `,
  ],
})
export class SelectsPage {
  protected readonly categories: readonly TxSelectOption<string>[] = CATEGORIES.map((c) => ({
    value: c,
    label: c,
  }));
  protected readonly suppliers = SUPPLIER_OPTIONS;
  protected readonly grouped = GROUPED;
  protected readonly many = MANY;

  protected readonly category = signal<string | null>(null);
  protected readonly supplier = signal<string | null>(null);
  protected readonly status = signal<string | null>('review');
  protected readonly item = signal<string | null>(null);
  protected readonly required = signal<string | null>(null);
  protected readonly chosen = signal<string[]>(['Everline']);
  protected readonly statuses = signal<string[]>([]);

  protected readonly singleCode = `<tx-select
  label="Category"
  placeholder="All categories"
  [options]="categories"
  [(value)]="category"
  clearable />`;

  protected readonly groupCode = `options: TxSelectOption<string>[] = [
  { value: 'draft',    label: 'Draft',     group: 'Open' },
  { value: 'review',   label: 'In review', group: 'Open' },
  { value: 'approved', label: 'Approved',  group: 'Closed' },
  { value: 'archived', label: 'Archived',  group: 'Closed', disabled: true },
];`;

  protected readonly filterCode = `<!-- automatic past filterThreshold options -->
<tx-select label="Item" [options]="items" [(value)]="item" clearable />

<!-- or force it -->
<tx-select label="Category" [options]="categories" [filterable]="true" [(value)]="category" />`;

  protected readonly multiCode = `<tx-multi-select
  label="Suppliers"
  [options]="suppliers"
  [(value)]="chosen"
  [maxVisibleChips]="2" />`;

  protected readonly selectApi: readonly ApiRow[] = [
    { name: 'options', type: 'TxSelectOption<V>[]', description: 'Required. value, label, and optional hint, group and disabled.' },
    { name: 'value', type: 'model<V | null>', def: 'null', description: 'Two-way bindable selection.' },
    { name: 'label', type: 'string', def: "''", description: 'Visible label and the trigger’s accessible name.' },
    { name: 'ariaLabel', type: 'string', def: "''", description: 'Accessible name when there is no visible label.' },
    { name: 'placeholder', type: 'string', def: "'Select…'", description: 'Shown while nothing is selected.' },
    { name: 'clearable', type: 'boolean', def: 'false', description: 'Adds a clear control once a value is set.' },
    { name: 'filterable', type: "boolean | 'auto'", def: "'auto'", description: 'Filter field. Auto shows it past filterThreshold options.' },
    { name: 'loading', type: 'boolean', def: 'false', description: 'Replaces the list with a loading message.' },
    { name: 'compareWith', type: '(a: V, b: V) => boolean', def: 'Object.is', description: 'Equality used to match value against an option.' },
    { name: 'opened / closed', type: 'output<void>', description: 'Panel lifecycle.' },
  ];

  protected readonly multiApi: readonly ApiRow[] = [
    { name: 'value', type: 'model<V[]>', def: '[]', description: 'Always an array, never null.' },
    { name: 'maxVisibleChips', type: 'number', def: '3', description: 'Chips shown before the rest collapse into “+N more”.' },
    { name: 'selectAll', type: 'boolean', def: 'true', description: 'Offers a select-all / clear-all control.' },
  ];

  protected readonly keys = [
    { keys: 'Enter · Space · Alt+↓', action: 'Open the panel' },
    { keys: '↑ ↓', action: 'Move between options' },
    { keys: 'Home · End', action: 'First or last option' },
    { keys: 'a–z', action: 'Typeahead' },
    { keys: 'Enter', action: 'Commit the active option' },
    { keys: 'Space', action: 'Toggle an option (multi select)' },
    { keys: 'Backspace', action: 'Remove the last chip (multi select, panel closed)' },
    { keys: 'Escape', action: 'Close without committing' },
  ];

  protected readonly dos = [
    'Give every select a label, or an ariaLabel when the label is implied by context.',
    'Group options when the list has natural sections.',
    'Use a multi select when the answer is genuinely a set, not a series of yes/no choices.',
    'Let the filter appear on its own — the threshold is configurable per app.',
  ];

  protected readonly donts = [
    'Do not use a select for two options; a radio group or toggle reads faster.',
    'Do not put the only explanation of an option inside its hint if it changes the meaning.',
    'Do not disable options without a way to find out why.',
    'Do not use a multi select where order matters — it reports selection, not sequence.',
  ];
}
