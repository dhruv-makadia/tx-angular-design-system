import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import {
  TxAppShell,
  TxDensity,
  TxHeader,
  TxIcon,
  TxNavSection,
  TxSidebar,
} from '@tx-angular-design-system/core';
import { ThemeService } from './theme.service';

const NAV: TxNavSection[] = [
  {
    label: 'Start here',
    items: [
      { id: 'overview', label: 'Overview', icon: 'info' },
      { id: 'getting-started', label: 'Getting started', icon: 'download' },
    ],
  },
  {
    label: 'Foundations',
    items: [
      { id: 'tokens', label: 'Tokens', icon: 'palette' },
      { id: 'theming', label: 'Theming', icon: 'edit', badge: 'live' },
    ],
  },
  {
    label: 'Components',
    items: [
      { id: 'buttons', label: 'Buttons & icons', icon: 'plus' },
      { id: 'inputs', label: 'Text & choice', icon: 'check' },
      { id: 'selects', label: 'Selects', icon: 'list' },
      { id: 'dates', label: 'Dates & progress', icon: 'info' },
      { id: 'table', label: 'Table', icon: 'table' },
      { id: 'hierarchy', label: 'Tree & reordering', icon: 'list' },
      { id: 'overlays', label: 'Disclosure & overlays', icon: 'menu' },
      { id: 'navigation', label: 'Navigation', icon: 'layout' },
    ],
  },
  {
    label: 'In practice',
    items: [{ id: 'catalogue', label: 'Composition', icon: 'external' }],
  },
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TxAppShell, TxSidebar, TxHeader, TxIcon],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly router = inject(Router);
  protected readonly theme = inject(ThemeService);

  protected readonly nav = NAV;
  protected readonly collapsed = signal(false);
  protected readonly drawerOpen = signal(false);
  protected readonly densities: readonly TxDensity[] = ['compact', 'standard', 'comfortable'];

  /** The sidebar's current item is derived from the URL, not stored twice. */
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  protected readonly activeId = computed(() => this.url().split('?')[0].replace(/^\//, '') || 'overview');

  protected readonly pageTitle = computed(() => {
    const id = this.activeId();
    for (const section of this.nav) {
      const match = section.items.find((item) => item.id === id);
      if (match) return match.label;
    }
    return 'Design system';
  });

  protected navigate(id: string): void {
    this.drawerOpen.set(false);
    void this.router.navigate([id]);
  }
}
