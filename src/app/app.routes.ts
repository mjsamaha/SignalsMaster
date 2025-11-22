import { Routes } from '@angular/router';
import { routes as tabRoutes } from './tabs/tabs.routes';

export const routes: Routes = [
  ...tabRoutes,
  {
    path: 'quiz',
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/quiz/quiz.page').then(m => m.QuizPage),
      },
      {
        path: ':mode/:username',
        loadComponent: () => import('./pages/quiz/quiz.page').then(m => m.QuizPage),
      }
    ]
  },
  {
    path: 'practice-results',
    loadComponent: () => import('./pages/practice-results/practice-results.page').then(m => m.PracticeResultsPage),
  },
  {
    path: 'competitive-results',
    loadComponent: () => import('./pages/competitive-results/competitive-results.page').then(m => m.CompetitiveResultsPage),
  },
  {
    path: '',
    redirectTo: 'tabs/home',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'tabs/home',
  },
];
