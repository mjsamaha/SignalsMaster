import { Routes } from '@angular/router';
import { routes as tabRoutes } from './tabs/tabs.routes';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  ...tabRoutes,
  {
    path: 'registration',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/registration/registration.page').then(m => m.RegistrationPage),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/profile/profile.page').then(m => m.ProfilePage),
  },
  {
    path: 'quiz',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/quiz/quiz.page').then(m => m.QuizPage),
      },
      {
        path: ':mode',
        loadComponent: () => import('./pages/quiz/quiz.page').then(m => m.QuizPage),
      }
    ]
  },
  {
    path: 'practice-results',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/practice-results/practice-results.page').then(m => m.PracticeResultsPage),
  },
  {
    path: 'practice-history',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/practice-history/practice-history.page').then(m => m.PracticeHistoryPage),
  },
  {
    path: 'competitive-results',
    canActivate: [authGuard],
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
