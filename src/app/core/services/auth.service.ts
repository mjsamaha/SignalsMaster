/**
 * AuthService - Authentication orchestration and session management.
 * Coordinates StorageService and UserService for device-based authentication.
 * Manages authentication state and provides reactive observables.
 */

import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StorageService } from './storage.service';
import { UserService } from './user.service';
import {
  User,
  UserRegistrationData,
  AuthResult,
  AuthState,
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly storage = inject(StorageService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  // State management with BehaviorSubjects
  private userSubject = new BehaviorSubject<User | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(true);
  private initializedSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  // Public observables for reactive state
  public currentUser$: Observable<User | null> = this.userSubject.asObservable();
  public isLoading$: Observable<boolean> = this.loadingSubject.asObservable();
  public isInitialized$: Observable<boolean> = this.initializedSubject.asObservable();
  public error$: Observable<string | null> = this.errorSubject.asObservable();
  public isAuthenticated$: Observable<boolean> = this.currentUser$.pipe(
    map(user => user !== null)
  );

  constructor() {
    console.log('[AuthService] Initialized');
  }

  /**
   * Initialize authentication on app startup.
   * Called by APP_INITIALIZER in main.ts.
   * Checks for existing user session and restores if valid.
   */
  async initializeAuth(): Promise<void> {
    console.log('[AuthService] Starting authentication initialization');
    this.setLoading(true);
    this.setError(null);

    try {
      // Step 1: Check for existing user ID in storage
      const userId = await this.storage.getCurrentUserId();
      console.log('[AuthService] Stored user ID:', userId ? 'found' : 'not found');

      if (userId) {
        // Step 2: User exists in storage, fetch from Firestore
        console.log('[AuthService] Fetching user from Firestore:', userId);
        const user = await this.userService.getUserById(userId);

        if (user) {
          // Step 3: Valid user found, update last login
          console.log('[AuthService] User found, updating last login');
          await this.userService.updateLastLogin(userId);

          // Update local storage with latest user data
          await this.storage.setCurrentUser(user);

          // Emit user state
          this.setUser(user);
          console.log('[AuthService] User session restored successfully');
        } else {
          // User not found in Firestore, clear storage
          console.log('[AuthService] User not found in Firestore, clearing storage');
          await this.storage.clearCurrentUser();
          this.setUser(null);
        }
      } else {
        // Step 4: No user ID in storage, check if device is registered
        console.log('[AuthService] No stored user, checking device registration');
        const deviceId = await this.storage.getOrCreateDeviceId();
        const existingUser = await this.userService.getUserByDeviceId(deviceId);

        if (existingUser) {
          // Device was registered before, restore session
          console.log('[AuthService] Found existing user for device, restoring session');
          await this.storage.setCurrentUser(existingUser);
          await this.userService.updateLastLogin(existingUser.user_id);
          this.setUser(existingUser);
        } else {
          // New device, no user found
          console.log('[AuthService] New device, no user found - registration required');
          this.setUser(null);
        }
      }

    } catch (error: any) {
      console.error('[AuthService] Error during initialization:', error);
      this.setError(error.message || 'Authentication initialization failed');
      this.setUser(null);
    } finally {
      this.setLoading(false);
      this.setInitialized(true);
      console.log('[AuthService] Authentication initialization complete');
    }
  }

  /**
   * Register a new user.
   * Creates user in Firestore and stores session locally.
   * @param data User registration data
   * @returns Authentication result
   */
  async registerUser(data: UserRegistrationData): Promise<AuthResult> {
    console.log('[AuthService] Registering new user');
    this.setLoading(true);
    this.setError(null);

    try {
      // Validate data
      const validation = this.userService.validateUserData(data);
      if (!validation.valid) {
        const errorMsg = validation.errors.join(', ');
        console.log('[AuthService] Validation failed:', errorMsg);
        this.setLoading(false);
        return {
          success: false,
          error: errorMsg,
          requiresRegistration: true,
        };
      }

      // Ensure device ID is set - always get/create it
      const deviceId = await this.storage.getOrCreateDeviceId();
      data.device_id = deviceId;
      console.log('[AuthService] Device ID for registration:', deviceId);

      // Check if device already has a user
      const existingUser = await this.userService.getUserByDeviceId(deviceId);
      if (existingUser) {
        console.log('[AuthService] Device already registered, restoring existing user');
        await this.storage.setCurrentUser(existingUser);
        this.setUser(existingUser);
        this.setLoading(false);
        return {
          success: true,
          user: existingUser,
        };
      }

      // Create user in Firestore
      console.log('[AuthService] Creating user in Firestore');
      const user = await this.userService.createUser(data);
      console.log('[AuthService] User created successfully:', user.user_id);

      // Store user session locally
      await this.storage.setCurrentUser(user);

      // Emit user state
      this.setUser(user);

      this.setLoading(false);
      return {
        success: true,
        user,
      };

    } catch (error: any) {
      console.error('[AuthService] Error during registration:', error);
      const errorMsg = error.message || 'Registration failed';
      this.setError(errorMsg);
      this.setLoading(false);

      return {
        success: false,
        error: errorMsg,
        requiresRegistration: true,
      };
    }
  }

  /**
   * Automatic login for returning users.
   * Fetches latest user data from Firestore.
   * @returns Authentication result
   */
  async autoLogin(): Promise<AuthResult> {
    console.log('[AuthService] Attempting auto-login');
    this.setLoading(true);
    this.setError(null);

    try {
      const userId = await this.storage.getCurrentUserId();

      if (!userId) {
        console.log('[AuthService] No stored user ID, auto-login not possible');
        this.setLoading(false);
        return {
          success: false,
          requiresRegistration: true,
        };
      }

      const user = await this.userService.getUserById(userId);

      if (!user) {
        console.log('[AuthService] User not found in Firestore');
        await this.storage.clearCurrentUser();
        this.setUser(null);
        this.setLoading(false);
        return {
          success: false,
          requiresRegistration: true,
        };
      }

      // Update last login
      await this.userService.updateLastLogin(userId);

      // Update local storage
      await this.storage.setCurrentUser(user);

      // Emit user state
      this.setUser(user);

      console.log('[AuthService] Auto-login successful');
      this.setLoading(false);

      return {
        success: true,
        user,
      };

    } catch (error: any) {
      console.error('[AuthService] Error during auto-login:', error);
      this.setError(error.message);
      this.setLoading(false);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Logout current user.
   * Clears local storage but preserves device ID.
   */
  async logout(): Promise<void> {
    console.log('[AuthService] Logging out user');
    this.setLoading(true);

    try {
      // Clear user data from storage (preserves device ID)
      await this.storage.clearCurrentUser();

      // Clear user state
      this.setUser(null);
      this.setError(null);

      console.log('[AuthService] Logout successful');

      // Navigate to registration page
      this.router.navigate(['/registration']);

    } catch (error: any) {
      console.error('[AuthService] Error during logout:', error);
      this.setError(error.message);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Refresh current user session.
   * Fetches latest user data from Firestore.
   * Called when app resumes from background.
   */
  async refreshSession(): Promise<void> {
    console.log('[AuthService] Refreshing session');

    try {
      const userId = await this.storage.getCurrentUserId();

      if (!userId) {
        console.log('[AuthService] No user to refresh');
        return;
      }

      const user = await this.userService.getUserById(userId);

      if (!user) {
        console.log('[AuthService] User no longer exists, clearing session');
        await this.storage.clearCurrentUser();
        this.setUser(null);
        return;
      }

      // Update last login timestamp
      await this.userService.updateLastLogin(userId);

      // Update local storage with latest data
      await this.storage.setCurrentUser(user);

      // Emit updated user state
      this.setUser(user);

      console.log('[AuthService] Session refreshed successfully');

    } catch (error: any) {
      console.error('[AuthService] Error refreshing session:', error);
      // Don't throw error, just log it (non-blocking)
    }
  }

  /**
   * Validate current session.
   * Checks if user exists in Firestore and storage.
   * @returns True if session is valid
   */
  async validateSession(): Promise<boolean> {
    console.log('[AuthService] Validating session');

    try {
      const userId = await this.storage.getCurrentUserId();

      if (!userId) {
        console.log('[AuthService] No user ID, session invalid');
        return false;
      }

      const user = await this.userService.getUserById(userId);

      if (!user) {
        console.log('[AuthService] User not found, session invalid');
        await this.storage.clearCurrentUser();
        this.setUser(null);
        return false;
      }

      console.log('[AuthService] Session valid');
      return true;

    } catch (error: any) {
      console.error('[AuthService] Error validating session:', error);
      return false;
    }
  }

  /**
   * Get current user (synchronous).
   * @returns Current user or null
   */
  getCurrentUser(): User | null {
    return this.userSubject.value;
  }

  /**
   * Get current user ID (synchronous).
   * @returns Current user ID or null
   */
  getCurrentUserId(): string | null {
    const user = this.userSubject.value;
    return user ? user.user_id : null;
  }

  /**
   * Check if user is authenticated (synchronous).
   * @returns True if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.userSubject.value !== null;
  }

  /**
   * Check if authentication is initialized (synchronous).
   * @returns True if initialization complete
   */
  isInitialized(): boolean {
    return this.initializedSubject.value;
  }

  /**
   * Get current authentication state (synchronous).
   * @returns Current auth state
   */
  getAuthState(): AuthState {
    return {
      user: this.userSubject.value,
      loading: this.loadingSubject.value,
      initialized: this.initializedSubject.value,
      error: this.errorSubject.value,
    };
  }

  /**
   * Set user state and emit to subscribers.
   * @param user User object or null
   * @private
   */
  private setUser(user: User | null): void {
    this.userSubject.next(user);
  }

  /**
   * Set loading state and emit to subscribers.
   * @param loading Loading state
   * @private
   */
  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  /**
   * Set initialized state and emit to subscribers.
   * @param initialized Initialized state
   * @private
   */
  private setInitialized(initialized: boolean): void {
    this.initializedSubject.next(initialized);
  }

  /**
   * Set error state and emit to subscribers.
   * @param error Error message or null
   * @private
   */
  private setError(error: string | null): void {
    this.errorSubject.next(error);
  }
}
