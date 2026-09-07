import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TxIcon } from '../icon/icon';

/**
 * Application header.
 *
 * Renders as a `<header>` landmark with three regions: brand, a free middle
 * (search, breadcrumbs) and trailing actions. It holds no navigation state of
 * its own — the menu button simply reports that it was pressed.
 *
 * ```html
 * <tx-header heading="Catalogue" menu="auto" (menuToggle)="drawer.set(!drawer())">
 *   <span slot="brand">Acme</span>
 *   <tx-input slot="middle" type="search" placeholder="Search" />
 *   <div slot="actions">
 *     <tx-button variant="text">Sign out</tx-button>
 *   </div>
 * </tx-header>
 * ```
 */
@Component({
  selector: 'tx-header',
  standalone: true,
  imports: [TxIcon],
  templateUrl: './header.html',
  styleUrl: './header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'tx-header',
    '[class.tx-header--sticky]': 'sticky()',
    '[class.tx-header--bordered]': 'bordered()',
    '[attr.data-menu]': 'menu()',
  },
})
export class TxHeader {
  /** Page title rendered beside the brand. */
  readonly heading = input<string>('');
  /**
   * When the navigation toggle is shown.
   *
   * - `auto` — only below the shell's breakpoint, where the sidebar becomes a
   *   drawer. Above it the sidebar is always on screen, so a toggle would open
   *   nothing.
   * - `always` / `never` — pin it, for apps whose navigation does not follow
   *   the shell's pattern.
   */
  readonly menu = input<'auto' | 'always' | 'never'>('never');
  readonly sticky = input(true, { transform: booleanAttribute });
  readonly bordered = input(true, { transform: booleanAttribute });
  readonly menuLabel = input($localize`:@@tx.header.menu:Toggle navigation`);

  readonly menuToggle = output<void>();
}

function booleanAttribute(value: unknown): boolean {
  return value != null && `${value}` !== 'false';
}
