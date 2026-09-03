import { ChangeDetectionStrategy, Component, computed, input, model, output, signal } from '@angular/core';
import { TxIcon } from '../icon/icon';
import { TxNavItem, TxNavSection } from '../../utils/types';

/**
 * Vertical navigation.
 *
 * Renders as `<nav>` → `<ul>` → links or buttons, so `Tab` order, `Enter`
 * activation and "open in new tab" all come from the platform. It is *not* a
 * listbox: navigation is a set of links, and treating it as a single-select
 * widget would break the browser behaviours people expect from a sidebar.
 *
 * Router-agnostic by design — give it `activeId`, listen to `itemSelect`, and
 * wire routing in the application. Items with an `href` render as real anchors.
 *
 * ```html
 * <tx-sidebar [sections]="nav" [(activeId)]="page" [(collapsed)]="railed">
 *   <span slot="brand">Acme Catalogue</span>
 *   <span slot="brand-compact">A</span>
 * </tx-sidebar>
 * ```
 *
 * `brand` shows when expanded, `brand-compact` when collapsed to the rail —
 * a wordmark clipped to 3.5rem looks like a bug, so the choice is explicit.
 *
 * ### Keyboard
 * | Key | Action |
 * | --- | --- |
 * | `Tab` | Move between items |
 * | `Enter` | Activate; on a group, expand or collapse |
 * | `Space` | Activate a group toggle |
 */
@Component({
  selector: 'tx-sidebar',
  standalone: true,
  imports: [TxIcon],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'tx-sidebar',
    '[class.tx-sidebar--collapsed]': 'collapsed()',
  },
})
export class TxSidebar {
  readonly sections = input.required<readonly TxNavSection[]>();
  /** Accessible name for the landmark. */
  readonly label = input($localize`:@@tx.sidebar.label:Main navigation`);
  /** Collapses to an icon rail. Labels stay in the accessibility tree. */
  readonly collapsed = model(false);

  /** Id of the item to mark current. */
  readonly activeId = model<string | null>(null);

  readonly itemSelect = output<TxNavItem>();

  protected readonly expandLabel = $localize`:@@tx.sidebar.expand:Expand navigation`;
  protected readonly collapseLabel = $localize`:@@tx.sidebar.collapse:Collapse navigation`;

  /** Ids of groups the user has opened. */
  private readonly openGroups = signal<ReadonlySet<string>>(new Set());

  /** A group containing the active item starts open. */
  protected readonly effectiveOpen = computed(() => {
    const open = new Set(this.openGroups());
    const active = this.activeId();
    if (active) {
      for (const section of this.sections()) {
        for (const item of section.items) {
          if (item.children?.some((child) => child.id === active)) open.add(item.id);
        }
      }
    }
    return open;
  });

  protected isOpen(item: TxNavItem): boolean {
    return this.effectiveOpen().has(item.id);
  }

  protected isActive(item: TxNavItem): boolean {
    return this.activeId() === item.id;
  }

  /** A collapsed parent still shows as current when a child is selected. */
  protected hasActiveChild(item: TxNavItem): boolean {
    const active = this.activeId();
    return !!active && !!item.children?.some((child) => child.id === active);
  }

  protected toggleGroup(item: TxNavItem): void {
    this.openGroups.update((current) => {
      const next = new Set(current);
      if (this.effectiveOpen().has(item.id)) next.delete(item.id);
      else next.add(item.id);
      return next;
    });
  }

  protected select(item: TxNavItem, event?: Event): void {
    if (item.disabled) {
      event?.preventDefault();
      return;
    }
    if (item.children?.length) {
      this.toggleGroup(item);
      return;
    }
    this.activeId.set(item.id);
    this.itemSelect.emit(item);
  }

  protected toggleCollapsed(): void {
    this.collapsed.update((value) => !value);
  }
}
