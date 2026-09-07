import { Tree, TreeItem, TreeItemGroup } from '@angular/aria/tree';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  model,
  output,
} from '@angular/core';
import { TxIcon } from '../icon/icon';
import { TxTreeNode } from '../../utils/types';

/**
 * A hierarchy of nodes.
 *
 * Expansion, roving focus, typeahead, arrow-key navigation and the whole
 * `role="tree"` contract come from Angular Aria's tree primitives. The
 * component supplies structure, styling and the search behaviour on top.
 *
 * Nodes are data, and children may be supplied lazily — give a node
 * `hasChildren: true` with no `children`, listen to `expandedChange`, and fill
 * them in when it opens.
 *
 * ```html
 * <tx-tree
 *   [nodes]="nodes()"
 *   [(selected)]="selection"
 *   [(expanded)]="open"
 *   multi
 *   filterable />
 * ```
 *
 * ### Static hierarchies
 * `[collapsible]="false"` keeps every branch open: the twisties go, `←` and
 * `→` stop opening and closing, and `expanded` is ignored. Use it when the
 * shape *is* the content — an outline, a bill of materials, a table of
 * contents — and hiding part of it would hide the point.
 *
 * ### Keyboard
 * | Key | Action |
 * | --- | --- |
 * | `↑` `↓` | Move between visible nodes |
 * | `→` | Expand, or move to the first child |
 * | `←` | Collapse, or move to the parent |
 * | `Home` `End` | First or last visible node |
 * | `Enter` `Space` | Select |
 * | any character | Typeahead |
 */
@Component({
  selector: 'tx-tree',
  standalone: true,
  imports: [Tree, TreeItem, TreeItemGroup, NgTemplateOutlet, TxIcon],
  templateUrl: './tree.html',
  styleUrl: './tree.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'tx-tree',
    '[class.tx-tree--static]': '!collapsible()',
  },
})
export class TxTree<V> {
  readonly nodes = input.required<readonly TxTreeNode<V>[]>();
  /** Accessible name for the tree. */
  readonly label = input($localize`:@@tx.tree.label:Tree`);
  readonly multi = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Shows a filter field above the tree. */
  readonly filterable = input(false, { transform: booleanAttribute });
  /**
   * Whether branches can be closed. Set false and the tree stays fully open,
   * with no twisties and nothing for `←` to collapse.
   */
  readonly collapsible = input(true, { transform: booleanAttribute });
  readonly emptyText = input($localize`:@@tx.tree.empty:Nothing here`);

  /** Selected node values. Always an array, even in single-select mode. */
  readonly selected = model<V[]>([]);
  /** Values of the expanded nodes. Ignored when `collapsible` is false. */
  readonly expanded = model<V[]>([]);

  readonly nodeSelect = output<TxTreeNode<V>>();

  protected readonly filterText = model('');
  protected readonly filterLabel = $localize`:@@tx.tree.filter:Filter nodes`;

  /**
   * Filtering keeps a node when it matches, when a descendant matches, or when
   * an ancestor matches — dropping the ancestors of a hit would leave the
   * result dangling with no path to it.
   */
  protected readonly visibleNodes = computed(() => {
    const needle = this.filterText().trim().toLowerCase();
    if (!needle) return this.nodes();
    return filterTree(this.nodes(), needle);
  });

  /**
   * Two states force the tree open: a filter, because the hits would otherwise
   * stay hidden, and a non-collapsible tree, where there is nothing to close.
   */
  protected readonly forcedOpen = computed(
    () => !this.collapsible() || this.filterText().trim().length > 0,
  );

  protected readonly effectiveExpanded = computed(() =>
    this.forcedOpen() ? collectValues(this.visibleNodes()) : this.expanded(),
  );

  protected isExpanded(node: TxTreeNode<V>): boolean {
    return this.effectiveExpanded().some((v) => Object.is(v, node.value));
  }

  protected onExpandedChange(node: TxTreeNode<V>, isOpen: boolean, item: TreeItem<V>): void {
    if (this.forcedOpen()) {
      // Aria's `expanded` is a model, so it has already written `false` into
      // its own signal. Our one-way binding will not push `true` back — the
      // bound expression never changed — so the branch would close on screen
      // even though nothing was committed. Re-assert it.
      if (!isOpen) item.expanded.set(true);
      return;
    }

    const current = this.expanded();
    const has = current.some((v) => Object.is(v, node.value));
    if (isOpen === has) return;

    this.expanded.set(isOpen ? [...current, node.value] : current.filter((v) => !Object.is(v, node.value)));
  }

  protected onSelected(values: V[]): void {
    const current = this.selected();
    const same =
      values.length === current.length && values.every((v) => current.some((c) => Object.is(c, v)));
    if (same) return;

    this.selected.set(values);

    const added = values.find((v) => !current.some((c) => Object.is(c, v)));
    if (added !== undefined) {
      const node = findNode(this.nodes(), added);
      if (node) this.nodeSelect.emit(node);
    }
  }

  protected hasChildren(node: TxTreeNode<V>): boolean {
    return !!node.children?.length || node.hasChildren === true;
  }
}

/** Keeps matches, their descendants, and the ancestors that lead to them. */
function filterTree<V>(nodes: readonly TxTreeNode<V>[], needle: string): TxTreeNode<V>[] {
  const out: TxTreeNode<V>[] = [];
  for (const node of nodes) {
    const selfMatches = node.label.toLowerCase().includes(needle);
    const children = node.children ? filterTree(node.children, needle) : [];
    if (selfMatches) {
      out.push(node);
    } else if (children.length) {
      out.push({ ...node, children });
    }
  }
  return out;
}

function collectValues<V>(nodes: readonly TxTreeNode<V>[]): V[] {
  const out: V[] = [];
  const walk = (list: readonly TxTreeNode<V>[]) => {
    for (const node of list) {
      out.push(node.value);
      if (node.children) walk(node.children);
    }
  };
  walk(nodes);
  return out;
}

function findNode<V>(nodes: readonly TxTreeNode<V>[], value: V): TxTreeNode<V> | undefined {
  for (const node of nodes) {
    if (Object.is(node.value, value)) return node;
    const found = node.children && findNode(node.children, value);
    if (found) return found;
  }
  return undefined;
}
