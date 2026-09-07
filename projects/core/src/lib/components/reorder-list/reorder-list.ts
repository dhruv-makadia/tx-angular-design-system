import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDragPlaceholder,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  input,
  model,
  output,
  signal,
  viewChildren,
} from '@angular/core';
import { TxIcon } from '../icon/icon';
import { TxItemAction, TxReorderActionEvent } from '../../utils/types';
import { TxButton } from '../button/button';

/**
 * A list whose order the user can change.
 *
 * Pointer dragging comes from the CDK. **Keyboard reordering is implemented
 * here on purpose**: drag-and-drop alone is unusable without a mouse, so every
 * row carries a focusable handle that moves the item with the arrow keys and
 * announces the result. A reorder control that only works by dragging is not
 * finished.
 *
 * The list is controlled — it never mutates the array it is given. `items` is a
 * model, so `[(items)]` works, and `orderChange` reports the new order for
 * callers that would rather persist it themselves.
 *
 * ```html
 * <tx-reorder-list
 *   [(items)]="columns"
 *   [labelOf]="labelOf"
 *   (orderChange)="save($event)" />
 * ```
 *
 * ### Keyboard
 * | Key | Action |
 * | --- | --- |
 * | `Tab` | Move between handles |
 * | `↑` `↓` | Move the item up or down |
 * | `Home` `End` | Move it to the start or end |
 */
@Component({
  selector: 'tx-reorder-list',
  standalone: true,
  imports: [CdkDropList, CdkDrag, CdkDragHandle, CdkDragPlaceholder, TxIcon, TxButton],
  templateUrl: './reorder-list.html',
  styleUrl: './reorder-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'tx-reorder-list',
    '[class.tx-reorder-list--disabled]': 'disabled()',
  },
})
export class TxReorderList<T> {
  /** The ordered items. Two-way bindable. */
  readonly items = model.required<readonly T[]>();

  /** Renders the visible label for an item. Defaults to `String(item)`. */
  readonly labelOf = input<(item: T) => string>((item) => String(item));
  /** Secondary line under the label. */
  readonly hintOf = input<(item: T) => string | undefined>(() => undefined);
  /** Marks individual items as fixed in place. */
  readonly lockedOf = input<(item: T) => boolean>(() => false);
  readonly trackBy = input<(item: T, index: number) => unknown>((item) => item);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly label = input($localize`:@@tx.reorderList.label:Reorderable list`);
  readonly emptyText = input($localize`:@@tx.reorderList.empty:Nothing to reorder`);

  /**
   * Buttons rendered after each item, in the same shape the table uses. A list
   * being reordered is usually being configured, and the entries themselves
   * need editing and withdrawing without leaving for another screen.
   */
  readonly actions = input<readonly TxItemAction<T>[]>([]);

  /** Emitted with the new order whenever it changes. */
  readonly orderChange = output<readonly T[]>();

  readonly actionSelect = output<TxReorderActionEvent<T>>();

  /** Announced after a keyboard move; screen readers get no drag feedback. */
  protected readonly announcement = signal('');

  private readonly handles = viewChildren<ElementRef<HTMLButtonElement>>('handle');

  protected readonly count = computed(() => this.items().length);

  protected readonly dragLabel = $localize`:@@tx.reorderList.drag:Reorder`;

  /** Actions that apply to this item; a hidden one is dropped from the group. */
  protected visibleActions(item: T): readonly TxItemAction<T>[] {
    return this.actions().filter((action) => !action.hidden?.(item));
  }

  protected isActionDisabled(action: TxItemAction<T>, item: T): boolean {
    return this.disabled() || (action.disabled?.(item) ?? false);
  }

  protected actionLabel(action: TxItemAction<T>, item: T): string {
    return action.ariaLabel?.(item) ?? action.label;
  }

  protected onAction(action: TxItemAction<T>, item: T): void {
    this.actionSelect.emit({ actionId: action.id, action, item });
  }

  protected onDrop(event: CdkDragDrop<readonly T[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    const next = [...this.items()];
    moveItemInArray(next, event.previousIndex, event.currentIndex);
    this.commit(next, event.currentIndex);
  }

  protected onHandleKeydown(event: KeyboardEvent, index: number): void {
    const last = this.count() - 1;
    let target = index;

    switch (event.key) {
      case 'ArrowUp':
        target = index - 1;
        break;
      case 'ArrowDown':
        target = index + 1;
        break;
      case 'Home':
        target = 0;
        break;
      case 'End':
        target = last;
        break;
      default:
        return;
    }

    event.preventDefault();
    if (target < 0 || target > last || target === index) return;
    if (this.disabled() || this.lockedOf()(this.items()[index])) return;

    const next = [...this.items()];
    moveItemInArray(next, index, target);
    this.commit(next, target);

    // Focus follows the item, not the position — otherwise a second press
    // moves whatever slid into the old slot.
    queueMicrotask(() => this.handles()[target]?.nativeElement.focus());
  }

  private commit(next: readonly T[], movedTo: number): void {
    this.items.set(next);
    this.orderChange.emit(next);

    const label = this.labelOf()(next[movedTo]);
    const position = movedTo + 1;
    const total = next.length;
    this.announcement.set(
      $localize`:@@tx.reorderList.moved:${label}:item: moved to position ${position}:position: of ${total}:total:`,
    );
  }
}
