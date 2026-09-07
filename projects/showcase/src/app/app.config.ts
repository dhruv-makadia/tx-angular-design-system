import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideTxDesignSystem, provideTxIcons } from '@tx-angular-design-system/core';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      // Navigating between doc pages should start at the top, not wherever the
      // previous page happened to be scrolled to.
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
    ),
    provideTxDesignSystem({ density: 'standard', pageSize: 10, pageSizeOptions: [10, 25, 50] }),
    // Three custom icons, registered the three ways the API accepts, so the
    // Buttons & icons page can show real registrations rather than a snippet.
    provideTxIcons({
      'demo-rocket': 'M12 2c3 3 4 7 4 10l-4 4-4-4c0-3 1-7 4-10z',
      'demo-crosshair': ['M12 3v18', 'M3 12h18', 'M12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10z'],
      'demo-seal': {
        paths: ['M8 1l2 5 5 2-5 2-2 5-2-5-5-2 5-2z'],
        viewBox: '0 0 16 16',
        stroked: false,
      },
    }),
  ],
};
