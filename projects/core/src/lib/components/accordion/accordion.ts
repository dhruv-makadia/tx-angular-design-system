import { AccordionGroup, AccordionPanel, AccordionTrigger } from '@angular/aria/accordion';
import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
  model,
  output,
} from '@angular/core';
import { TxIcon } from '../icon/icon';

let nextId = 0;

/**
 * A set of collapsible sections.
 *
 * Expansion state, roving focus and the `aria-controls` / `aria-expanded`
 * wiring come from Angular Aria's accordion primitives, so the component is
 * styling and structure only.
 *
 * ```html
 * <tx-accordion multi>
 *   <tx-accordion-panel label="Delivery" hint="Ships in 2 days">
 *     …
 *   </tx-accordion-panel>
 *   <tx-accordion-panel label="Returns" [expanded]="true">…</tx-accordion-panel>
 * </tx-accordion>
 * ```
 *
 * ### Keyboard
 * | Key | Action |
 * | --- | --- |
 * | `Tab` | Move into and out of the accordion |
 * | `↑` `↓` | Move between headers |
 * | `Home` `End` | First or last header |
 * | `Enter` `Space` | Expand or collapse |
 */
@Component({
  selector: 'tx-accordion',
  standalone: true,
  hostDirectives: [
    {
      directive: AccordionGroup,
      inputs: ['multiExpandable', 'disabled', 'wrap'],
    },
  ],
  template: '<ng-content />',
  styleUrl: './accordion.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'tx-accordion',
    '[class.tx-accordion--flush]': 'flush()',
  },
})
export class TxAccordion {
  /** Removes the outer border and radius, for accordions inside a panel. */
  readonly flush = input(false, { transform: booleanAttribute });
}

/**
 * One section of a {@link TxAccordion}.
 *
 * Content is projected, not passed as data, because panel bodies are arbitrary
 * markup — a form, a table, another accordion.
 */
@Component({
  selector: 'tx-accordion-panel',
  standalone: true,
  imports: [AccordionPanel, AccordionTrigger, TxIcon],
  templateUrl: './accordion-panel.html',
  styleUrl: './accordion-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'tx-accordion-panel',
    '[class.tx-accordion-panel--expanded]': 'expanded()',
    '[class.tx-accordion-panel--disabled]': 'disabled()',
  },
})
export class TxAccordionPanel {
  readonly label = input.required<string>();
  /** Secondary line under the label. */
  readonly hint = input<string>('');
  /** Name of a registered icon, shown before the label. */
  readonly icon = input<string>('');
  /**
   * Soft-disabled: the header stays focusable and readable but cannot be
   * activated. A native `disabled` button would leave the tab order, hiding the
   * section from keyboard and screen-reader users entirely.
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Two-way bindable. Emits `expandedChange`. */
  readonly expanded = model(false);

  readonly opened = output<void>();
  readonly closed = output<void>();

  protected readonly id = `tx-accordion-${nextId++}`;

  protected onExpanded(next: boolean): void {
    if (next === this.expanded()) return;
    this.expanded.set(next);
    (next ? this.opened : this.closed).emit();
  }
}
