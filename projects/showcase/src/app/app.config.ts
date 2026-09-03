import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideTxDesignSystem } from '@tx-angular-design-system/core';
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
  ],
};
