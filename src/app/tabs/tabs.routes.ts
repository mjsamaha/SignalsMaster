import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('../pages/home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'practice-mode',
        loadComponent: () =>
          import('../pages/practice-mode/practice-mode.page').then((m) => m.PracticeModePage),
      },
      {
        path: 'best-signaller',
        loadComponent: () =>
          import('../pages/best-signaller/best-signaller.page').then((m) => m.BestSignallerPage),
      },
      {
        path: 'leaderboard',
        loadComponent: () =>
          import('../pages/leaderboard/leaderboard.page').then((m) => m.LeaderboardPage),
      },
      {
        path: 'about',
        loadComponent: () =>
          import('../pages/about/about.page').then((m) => m.AboutPage),
      },
      {
        path: '',
        redirectTo: '/tabs/home',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/home',
    pathMatch: 'full',
  },
];
