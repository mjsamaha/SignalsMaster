
import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

/**
 * Defines the routing configuration for the main tab navigation.
 * Each child route loads its respective page component for lazy loading and modularity.
 */
export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('../pages/home/home.page').then((m) => m.HomePage), // Home tab route
      },
      {
        path: 'practice-mode',
        loadComponent: () =>
          import('../pages/practice-mode/practice-mode.page').then((m) => m.PracticeModePage), // Practice mode tab route
      },
      {
        path: 'best-signaller',
        loadComponent: () =>
          import('../pages/best-signaller/best-signaller.page').then((m) => m.BestSignallerPage), // Best signaller tab route
      },
      {
        path: 'leaderboard',
        loadComponent: () =>
          import('../pages/leaderboard/leaderboard.page').then((m) => m.LeaderboardPage), // Leaderboard tab route
      },
      {
        path: 'about',
        loadComponent: () =>
          import('../pages/about/about.page').then((m) => m.AboutPage), // About tab route
      },
      {
        path: '',
        redirectTo: '/tabs/home',
        pathMatch: 'full', // Default to home tab
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/home',
    pathMatch: 'full', // Redirect root to home tab
  },
];
