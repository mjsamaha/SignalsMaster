/**
 * Authentication Guards for route protection.
 * Implements functional guards for Angular 20 standalone routing.
 */

import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Auth Guard - Protects routes that require authentication.
 * Redirects unauthenticated users to registration page.
 * Preserves return URL for redirect after authentication.
 *
 * Usage in routes:
 * ```typescript
 * {
 *   path: 'profile',
 *   canActivate: [authGuard],
 *   loadComponent: () => import('./profile/profile.page')
 * }
 * ```
 */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): boolean => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('[AuthGuard] Checking authentication for:', state.url);

  // Wait for auth to initialize before checking
  if (!authService.isInitialized()) {
    console.log('[AuthGuard] Auth still initializing, allowing navigation (APP_INITIALIZER will handle)');
    // Auth is still initializing (APP_INITIALIZER running)
    // Allow navigation to proceed, APP_INITIALIZER will redirect if needed
    return true;
  }

  // Check if user is authenticated
  if (!authService.isAuthenticated()) {
    console.log('[AuthGuard] User not authenticated, redirecting to registration');

    // Store the attempted URL for redirecting after login
    router.navigate(['/registration'], {
      queryParams: { returnUrl: state.url }
    });

    return false;
  }

  console.log('[AuthGuard] User authenticated, allowing navigation');
  return true;
};

/**
 * Guest Guard - Prevents authenticated users from accessing auth pages.
 * Redirects authenticated users to home page.
 * Used on registration/login pages to prevent double registration.
 *
 * Usage in routes:
 * ```typescript
 * {
 *   path: 'registration',
 *   canActivate: [guestGuard],
 *   loadComponent: () => import('./registration/registration.page')
 * }
 * ```
 */
export const guestGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): boolean => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('[GuestGuard] Checking authentication for:', state.url);

  // Wait for auth to initialize
  if (!authService.isInitialized()) {
    console.log('[GuestGuard] Auth still initializing, allowing navigation');
    return true;
  }

  // If user is authenticated, redirect to home
  if (authService.isAuthenticated()) {
    console.log('[GuestGuard] User already authenticated, redirecting to home');
    router.navigate(['/tabs/home']);
    return false;
  }

  console.log('[GuestGuard] User not authenticated, allowing navigation to guest page');
  return true;
};

/**
 * Admin Guard - Protects routes that require admin privileges.
 * Redirects non-admin users to home page.
 * For Phase 4 - Admin Dashboard.
 *
 * Usage in routes:
 * ```typescript
 * {
 *   path: 'admin',
 *   canActivate: [adminGuard],
 *   loadComponent: () => import('./admin/admin.page')
 * }
 * ```
 */
export const adminGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): boolean => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('[AdminGuard] Checking admin access for:', state.url);

  // Must be authenticated first
  if (!authService.isAuthenticated()) {
    console.log('[AdminGuard] User not authenticated, redirecting to registration');
    router.navigate(['/registration'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  // Check admin flag
  const currentUser = authService.getCurrentUser();
  if (!currentUser?.is_admin) {
    console.log('[AdminGuard] User is not admin, redirecting to home');
    router.navigate(['/tabs/home']);
    return false;
  }

  console.log('[AdminGuard] User is admin, allowing navigation');
  return true;
};
