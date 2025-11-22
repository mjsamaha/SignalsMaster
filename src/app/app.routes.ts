import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'quiz',
    loadComponent: () => import('./pages/quiz/quiz.page').then((m) => m.QuizPage),
  },
];
