/**
 * A single choice in {@link TxSelect} or {@link TxMultiSelect}.
 *
 * `V` is the value type carried back to the form; it is never stringified, so
 * objects and branded ids work as-is. Options are compared with the component's
 * `compareWith` function, which defaults to `Object.is`.
 */
export interface TxSelectOption<V> {
  readonly value: V;
  readonly label: string;
  readonly disabled?: boolean;
  /** Optional heading; options sharing a group render under one label. */
  readonly group?: string;
  /** Secondary line rendered under the label. */
  readonly hint?: string;
}

/** Sort direction. `null` means the column is not currently sorted. */
export type TxSortDirection = 'asc' | 'desc' | null;

export interface TxSortState {
  readonly column: string | null;
  readonly direction: TxSortDirection;
}

export interface TxPageState {
  readonly pageIndex: number;
  readonly pageSize: number;
}

/** How a cell's content should be typeset. */
export type TxColumnVariant = 'text' | 'data' | 'numeric';

/**
 * Declarative column definition for {@link TxTable}.
 *
 * `variant` drives typography rather than layout: `data` and `numeric` switch
 * the cell to the monospaced face with tabular figures, which is what keeps
 * identifiers and measurements aligned down a column.
 */
export interface TxTableColumn<T> {
  /** Stable key. Also the value reported by sort events. */
  readonly key: string;
  readonly header: string;
  readonly sortable?: boolean;
  readonly align?: 'start' | 'center' | 'end';
  readonly variant?: TxColumnVariant;
  /** Any CSS width, e.g. `'12rem'` or `'minmax(8rem, 1fr)'`. */
  readonly width?: string;
  /** Extracts the cell value. Defaults to `row[key]`. */
  readonly value?: (row: T) => unknown;
  /** Hides the column without removing it from the definition list. */
  readonly hidden?: boolean;
}

/**
 * An entry in {@link TxSidebar}.
 *
 * Deliberately router-agnostic: the sidebar reports which item was chosen and
 * renders whatever `activeId` you give it. Wiring that to a router — or to
 * anything else — stays in the application, so the library needs no dependency
 * on `@angular/router`. Supply `href` instead and the item renders as a real
 * link.
 */
export interface TxNavItem {
  readonly id: string;
  readonly label: string;
  /** Name of a registered icon. */
  readonly icon?: string;
  /** Short count or status shown after the label. */
  readonly badge?: string | number;
  readonly disabled?: boolean;
  /** Renders the item as an anchor rather than a button. */
  readonly href?: string;
  /** One level of nesting. Children of children are ignored. */
  readonly children?: readonly TxNavItem[];
}

/** A titled run of navigation items. */
export interface TxNavSection {
  readonly label?: string;
  readonly items: readonly TxNavItem[];
}

/**
 * A node in {@link TxTree}.
 *
 * `hasChildren` without `children` marks a node as expandable but not yet
 * loaded — expand it, listen to `expandedChange`, and supply the children then.
 */
export interface TxTreeNode<V> {
  readonly value: V;
  readonly label: string;
  readonly icon?: string;
  readonly badge?: string | number;
  readonly disabled?: boolean;
  readonly children?: readonly TxTreeNode<V>[];
  /** Declares the node expandable before its children have been loaded. */
  readonly hasChildren?: boolean;
}
