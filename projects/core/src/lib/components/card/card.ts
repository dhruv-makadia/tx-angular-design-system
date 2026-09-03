import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type TxCardVariant = 'elevated' | 'outlined' | 'filled';

/**
 * A surface that groups related content.
 *
 * Purely presentational: slots for header, media, content and actions, and no
 * behaviour of its own. Anything interactive is projected in, so the card never
 * has to guess at focus order or roles.
 *
 * ```html
 * <tx-card variant="outlined">
 *   <span slot="title">Delivery</span>
 *   <span slot="subtitle">Updated 2 hours ago</span>
 *   <p>Body content.</p>
 *   <div slot="actions">
 *     <tx-button variant="text">Dismiss</tx-button>
 *   </div>
 * </tx-card>
 * ```
 */
@Component({
  selector: 'tx-card',
  standalone: true,
  templateUrl: './card.html',
  styleUrl: './card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'tx-card',
    '[attr.data-variant]': 'variant()',
  },
})
export class TxCard {
  readonly variant = input<TxCardVariant>('outlined');
  /** Removes the inner padding, for media or tables that should reach the edge. */
  readonly flush = input(false, { transform: booleanAttribute });
}

function booleanAttribute(value: unknown): boolean {
  return value != null && `${value}` !== 'false';
}
