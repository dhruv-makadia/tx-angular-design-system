import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Page frame: a fixed sidebar column beside a scrolling content column, with a
 * header above the content.
 *
 * It owns layout only — no navigation state, no routing. Project a
 * {@link TxSidebar} into `sidebar`, a {@link TxHeader} into `header`, and the
 * page into the default slot.
 *
 * ```html
 * <tx-app-shell>
 *   <tx-sidebar slot="sidebar" [sections]="nav" [(activeId)]="page" />
 *   <tx-header slot="header" heading="Catalogue" />
 *   <router-outlet />
 * </tx-app-shell>
 * ```
 *
 * Below `--tx-app-shell-breakpoint` (48rem) the sidebar becomes an overlay
 * drawer rather than a column, so the content keeps its full width on small
 * screens.
 */
@Component({
  selector: 'tx-app-shell',
  standalone: true,
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'tx-app-shell',
    '[class.tx-app-shell--drawer-open]': 'drawerOpen()',
  },
})
export class TxAppShell {
  /** On narrow screens, whether the sidebar drawer is showing. */
  readonly drawerOpen = input(false, { transform: booleanAttribute });
  /** Caps the content column so long text does not run edge to edge. */
  readonly maxWidth = input<string>('none');
}

function booleanAttribute(value: unknown): boolean {
  return value != null && `${value}` !== 'false';
}
