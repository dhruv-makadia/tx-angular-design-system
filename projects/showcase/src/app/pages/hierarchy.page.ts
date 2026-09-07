import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TxReorderList, TxTree, TxTreeNode } from '@tx-angular-design-system/core';
import { ApiRow, DemoApi, DemoExample, DemoGuidance, DemoKeys, DemoPage } from '../shared/demo';

interface Column {
  readonly id: string;
  readonly name: string;
  readonly hint: string;
  readonly locked?: boolean;
}

const NODES: TxTreeNode<string>[] = [
  {
    value: 'line-1',
    label: 'Line 1',
    icon: 'layout',
    children: [
      {
        value: 'conveyor',
        label: 'Conveyor',
        badge: 12,
        children: [
          { value: 'belt', label: 'Belt assembly' },
          { value: 'drive', label: 'Drive unit' },
          { value: 'rollers', label: 'Idler rollers', badge: 34 },
        ],
      },
      {
        value: 'sorter',
        label: 'Sorter',
        children: [
          { value: 'arm', label: 'Diverter arm' },
          { value: 'chute', label: 'Chute' },
        ],
      },
    ],
  },
  {
    value: 'line-2',
    label: 'Line 2',
    icon: 'layout',
    children: [{ value: 'wrapper', label: 'Wrapper', badge: 3 }],
  },
  { value: 'spares', label: 'Spares store', icon: 'menu' },
  { value: 'retired', label: 'Retired assets', disabled: true },
];

@Component({
  standalone: true,
  imports: [DemoPage, DemoExample, DemoApi, DemoKeys, DemoGuidance, TxTree, TxReorderList],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <demo-page
      heading="Tree & reordering"
      lede="A hierarchy and a list whose order the user controls. Both are keyboard-complete —
            the tree through Angular Aria, the reorder list through handling we wrote, because
            drag-and-drop alone is unusable without a mouse."
    >
      <demo-example
        heading="Tree"
        note="Expansion, arrow-key navigation and typeahead come from Aria. Filtering keeps the ancestors of a match so a hit is never orphaned from its path."
        [code]="treeCode"
        column
      >
        <div class="panel">
          <tx-tree
            [nodes]="nodes"
            [(selected)]="selected"
            [(expanded)]="expanded"
            label="Asset hierarchy"
            filterable
          />
        </div>
        <p class="state">
          selected: <code>{{ selected().length ? selected().join(', ') : '(none)' }}</code>
        </p>
      </demo-example>

      <demo-example
        heading="A hierarchy that never closes"
        note="collapsible=false keeps every branch open. The twisties go, and ← and → stop opening and closing."
        [code]="staticCode"
        column
      >
        <div class="panel">
          <tx-tree
            [nodes]="nodes"
            [(selected)]="staticSelected"
            label="Bill of materials"
            [collapsible]="false"
          />
        </div>
        <p class="prose">
          Use it when the shape <em>is</em> the content — an outline, a bill of materials, a table
          of contents — and hiding part of it would hide the point. Selection, arrow-key navigation
          and typeahead all still work; only the opening and closing goes.
          <code>expanded</code> is ignored while it is off, so turning it back on returns the tree
          to whatever that model says.
        </p>
      </demo-example>

      <demo-example
        heading="Lazy children"
        note="Give a node hasChildren without children and it renders as expandable; load them when expandedChange fires."
        [code]="lazyCode"
        column
      >
        <p class="prose">
          The tree never fetches anything itself. It reports what opened and renders whatever
          <code>nodes</code> then contains, which keeps loading, caching and error handling in the
          application where they belong.
        </p>
      </demo-example>

      <demo-example
        heading="Reorder list"
        note="Focus a handle and use the arrow keys. Each move is announced; the array you pass in is never mutated."
        [code]="reorderCode"
        column
      >
        <div class="panel panel--plain">
          <tx-reorder-list
            [(items)]="columns"
            [labelOf]="labelOf"
            [hintOf]="hintOf"
            [lockedOf]="lockedOf"
            [trackBy]="trackById"
          />
        </div>
        <p class="state">order: <code>{{ order() }}</code></p>
      </demo-example>

      <demo-api heading="tx-tree" [rows]="treeApi" />
      <demo-api heading="tx-reorder-list" [rows]="reorderApi" />
      <demo-keys [rows]="keys" />
      <demo-guidance [dos]="dos" [donts]="donts" />
    </demo-page>
  `,
  styles: [
    `
      .panel {
        width: 100%;
        max-width: 32rem;
        padding: var(--tx-space-3);
        background-color: var(--tx-color-surface-raised);
        border: var(--tx-border-width) solid var(--tx-color-border);
        border-radius: var(--tx-radius-lg);
      }
      .panel--plain {
        background: none;
        border: 0;
        padding: 0;
      }
      .state,
      .prose {
        margin: var(--tx-space-3) 0 0;
        font-size: var(--tx-text-sm);
        color: var(--tx-color-on-surface-muted);
      }
      .prose {
        margin: 0;
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
export class HierarchyPage {
  protected readonly nodes = NODES;
  protected readonly selected = signal<string[]>([]);
  protected readonly staticSelected = signal<string[]>(['belt']);
  protected readonly expanded = signal<string[]>(['line-1']);

  protected readonly columns = signal<readonly Column[]>([
    { id: 'sku', name: 'SKU', hint: 'Identifier' },
    { id: 'name', name: 'Item', hint: 'Description' },
    { id: 'stock', name: 'On hand', hint: 'Numeric' },
    { id: 'status', name: 'Status', hint: 'Always shown', locked: true },
  ]);

  protected readonly order = () => this.columns().map((c) => c.id).join(' → ');

  protected readonly labelOf = (c: Column) => c.name;
  protected readonly hintOf = (c: Column) => c.hint;
  protected readonly lockedOf = (c: Column) => !!c.locked;
  protected readonly trackById = (c: Column) => c.id;

  protected readonly treeCode = `nodes: TxTreeNode<string>[] = [
  { value: 'line-1', label: 'Line 1', icon: 'layout', children: [
    { value: 'conveyor', label: 'Conveyor', badge: 12, children: [
      { value: 'belt', label: 'Belt assembly' },
    ]},
  ]},
];

<tx-tree
  [nodes]="nodes"
  [(selected)]="selected"
  [(expanded)]="expanded"
  label="Asset hierarchy"
  filterable />`;

  protected readonly staticCode = `<tx-tree
  [nodes]="nodes"
  [(selected)]="selected"
  label="Bill of materials"
  [collapsible]="false" />`;

  protected readonly lazyCode = `// Expandable, but nothing loaded yet
{ value: 'sorter', label: 'Sorter', hasChildren: true }

<tx-tree [nodes]="nodes()" [(expanded)]="expanded" />

// Fill them in when the node opens
constructor() {
  effect(() => {
    for (const value of this.expanded()) this.loadChildrenOnce(value);
  });
}`;

  protected readonly reorderCode = `<tx-reorder-list
  [(items)]="columns"
  [labelOf]="labelOf"
  [lockedOf]="lockedOf"
  [trackBy]="trackById"
  (orderChange)="persist($event)" />`;

  protected readonly treeApi: readonly ApiRow[] = [
    { name: 'nodes', type: 'TxTreeNode<V>[]', description: 'value, label, and optional icon, badge, disabled, children, hasChildren.' },
    { name: 'selected', type: 'model<V[]>', def: '[]', description: 'Selected values. An array even in single-select mode.' },
    { name: 'expanded', type: 'model<V[]>', def: '[]', description: 'Values of the open nodes.' },
    { name: 'multi', type: 'boolean', def: 'false', description: 'Allows more than one selection.' },
    { name: 'filterable', type: 'boolean', def: 'false', description: 'Shows a filter field; matches keep their ancestors and descendants.' },
    { name: 'collapsible', type: 'boolean', def: 'true', description: 'Set false to keep every branch open: no twisties, nothing for ← to close, and expanded is ignored.' },
    { name: 'label', type: 'string', def: "'Tree'", description: 'Accessible name for the tree.' },
    { name: 'nodeSelect', type: 'output<TxTreeNode<V>>', description: 'The node that was just selected.' },
  ];

  protected readonly reorderApi: readonly ApiRow[] = [
    { name: 'items', type: 'model<readonly T[]>', description: 'The ordered items. Two-way bindable; never mutated in place.' },
    { name: 'labelOf', type: '(item: T) => string', def: 'String(item)', description: 'Visible label for an item.' },
    { name: 'hintOf', type: '(item: T) => string | undefined', description: 'Secondary line under the label.' },
    { name: 'lockedOf', type: '(item: T) => boolean', def: '() => false', description: 'Marks individual items as fixed in place.' },
    { name: 'trackBy', type: '(item: T, i: number) => unknown', def: 'item => item', description: 'Identity for @for.' },
    { name: 'orderChange', type: 'output<readonly T[]>', description: 'The new order, after a drag or a keyboard move.' },
  ];

  protected readonly keys = [
    { keys: '↑ ↓', action: 'Tree: move between visible nodes · Reorder: move the focused item' },
    { keys: '→', action: 'Tree: expand, or move to the first child' },
    { keys: '←', action: 'Tree: collapse, or move to the parent' },
    { keys: 'Home · End', action: 'Tree: first or last node · Reorder: move to the start or end' },
    { keys: 'Enter · Space', action: 'Tree: select the focused node' },
    { keys: 'a–z', action: 'Tree: typeahead' },
  ];

  protected readonly dos = [
    'Give the tree a label — it is the accessible name of the whole structure.',
    'Use hasChildren for branches you have not loaded yet, so they still look expandable.',
    'Keep the reorder list short enough to see at once; paginated reordering confuses.',
    'Lock items that genuinely cannot move, rather than silently ignoring the attempt.',
  ];

  protected readonly donts = [
    'Do not nest a tree more than about four levels; the indentation stops being readable.',
    'Do not rely on drag alone — the keyboard path is what makes reordering usable.',
    'Do not filter a tree without keeping the ancestors of a match; the hit loses its context.',
    'Do not mutate the array you pass to the reorder list; treat the order as reported state.',
  ];
}
