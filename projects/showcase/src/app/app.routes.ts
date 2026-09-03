import { Routes } from '@angular/router';

/**
 * Every page is lazily loaded: the showcase carries the whole library plus
 * demo data, and there is no reason for the overview to pay for the table.
 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'overview' },
  {
    path: 'overview',
    title: 'Overview · tx/core',
    loadComponent: () => import('./pages/overview.page').then((m) => m.OverviewPage),
  },
  {
    path: 'getting-started',
    title: 'Getting started · tx/core',
    loadComponent: () => import('./pages/getting-started.page').then((m) => m.GettingStartedPage),
  },
  {
    path: 'tokens',
    title: 'Tokens · tx/core',
    loadComponent: () => import('./pages/tokens.page').then((m) => m.TokensPage),
  },
  {
    path: 'theming',
    title: 'Theming · tx/core',
    loadComponent: () => import('./pages/theming.page').then((m) => m.ThemingPage),
  },
  {
    path: 'buttons',
    title: 'Buttons · tx/core',
    loadComponent: () => import('./pages/buttons.page').then((m) => m.ButtonsPage),
  },
  {
    path: 'inputs',
    title: 'Text & choice · tx/core',
    loadComponent: () => import('./pages/inputs.page').then((m) => m.InputsPage),
  },
  {
    path: 'selects',
    title: 'Selects · tx/core',
    loadComponent: () => import('./pages/selects.page').then((m) => m.SelectsPage),
  },
  {
    path: 'table',
    title: 'Table · tx/core',
    loadComponent: () => import('./pages/table.page').then((m) => m.TablePage),
  },
  {
    path: 'hierarchy',
    title: 'Tree & reordering · tx/core',
    loadComponent: () => import('./pages/hierarchy.page').then((m) => m.HierarchyPage),
  },
  {
    path: 'overlays',
    title: 'Disclosure & overlays · tx/core',
    loadComponent: () => import('./pages/overlays.page').then((m) => m.OverlaysPage),
  },
  {
    path: 'navigation',
    title: 'Navigation · tx/core',
    loadComponent: () => import('./pages/navigation.page').then((m) => m.NavigationPage),
  },
  {
    path: 'catalogue',
    title: 'Composition · tx/core',
    loadComponent: () => import('./pages/catalogue.page').then((m) => m.CataloguePage),
  },
  { path: '**', redirectTo: 'overview' },
];
