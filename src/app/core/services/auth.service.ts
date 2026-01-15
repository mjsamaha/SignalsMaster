/**
 * AuthService - Authentication orchestration and session management.
 * Coordinates StorageService and UserService for device-based authentication.
 * Manages authentication state and provides reactive observables.
 */

import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
// Fix Issue #249: Import Firebase Auth SDK for anonymous authentication
// This populates request.auth in Firestore security rules
import { Auth, signInAnonymously, onAuthStateChanged, User as FirebaseUser } from '@angular/fire/auth';
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
  // Fix Issue #249: Inject Firebase Auth to populate request.auth for Firestore rules
  private readonly firebaseAuth = inject(Auth);

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

    // Fix Issue #249: Listen to Firebase Auth state changes
    // Maintains sync between Firebase Auth tokens and custom user sessions
    onAuthStateChanged(this.firebaseAuth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        console.log('[AuthService] Firebase Auth state: signed in', firebaseUser.uid);
      } else {
        console.log('[AuthService] Firebase Auth state: signed out');
      }
    });
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
          // Fix Issue #249: Migrate existing users to Firebase Auth
          // Check if user has legacy custom user_id (pre-Firebase Auth integration)
          const needsMigration = await this.checkIfUserNeedsMigration(user);

          if (needsMigration) {
            console.log('[AuthService] Legacy user detected, migrating to Firebase Auth');
            try {
              const migratedUser = await this.migrateUserToFirebaseAuth(user);
              if (migratedUser) {
                console.log('[AuthService] User migration successful');
                this.setUser(migratedUser);
                this.setLoading(false);
                this.setInitialized(true);
                return;
              }
            } catch (migrationError: any) {
              console.error('[AuthService] Migration failed:', migrationError);
              // Fall through to normal flow
            }
          }

          // Fix Issue #249: Sign in with Firebase Auth to populate request.auth
          // Existing users need Firebase Auth token for Firestore operations
          console.log('[AuthService] Signing in existing user with Firebase Auth');
          try {
            await signInAnonymously(this.firebaseAuth);
            console.log('[AuthService] Firebase Auth session established for existing user');
          } catch (authError: any) {
            console.error('[AuthService] Firebase Auth sign-in failed:', authError);
            // Continue anyway - user data is still valid locally
          }

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

        // Fix: Defensive error handling for getUserByDeviceId query (Issue #227)
        // If query fails (permissions, network, etc), treat as new device
        // This is expected behavior for first-time app launch before any user registration
        let existingUser = null;
        try {
          existingUser = await this.userService.getUserByDeviceId(deviceId);
        } catch (queryError: any) {
          console.debug('[AuthService] Device not yet registered (expected for first launch):', queryError.message);
          // Continue with existingUser = null (new device flow)
        }

        if (existingUser) {
          // Fix Issue #249: Sign in with Firebase Auth for device-based user
          // This populates request.auth for Firestore security rules
          console.log('[AuthService] Signing in device-based user with Firebase Auth');
          try {
            await signInAnonymously(this.firebaseAuth);
            console.log('[AuthService] Firebase Auth session established for device user');
          } catch (authError: any) {
            console.error('[AuthService] Firebase Auth sign-in failed:', authError);
            // Continue anyway - user data is still valid locally
          }

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

      // Fix: Check if device already has a user (with defensive error handling)
      // If query fails, proceed with registration rather than blocking user
      // Query may fail on first launch - this is expected and allows registration to proceed
      let existingUser = null;
      try {
        existingUser = await this.userService.getUserByDeviceId(deviceId);
      } catch (queryError: any) {
        console.debug('[AuthService] Device check: No existing registration found (proceeding with new user creation)');
        // Continue with registration attempt
      }

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

      // Fix Issue #249: Sign in anonymously BEFORE creating Firestore user
      // This ensures request.auth is populated for subsequent Firestore operations
      console.log('[AuthService] Signing in anonymously to populate Firebase Auth token');
      const authResult = await signInAnonymously(this.firebaseAuth);
      const firebaseUid = authResult.user.uid;
      console.log('[AuthService] Firebase Auth UID:', firebaseUid);

      // Create user in Firestore with Firebase UID
      console.log('[AuthService] Creating user in Firestore with Firebase UID');
      const user = await this.userService.createUser(data, firebaseUid);
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

      // Fix Issue #249: Sign in with Firebase Auth to populate request.auth
      console.log('[AuthService] Signing in with Firebase Auth for auto-login');
      try {
        await signInAnonymously(this.firebaseAuth);
        console.log('[AuthService] Firebase Auth session established');
      } catch (authError: any) {
        console.error('[AuthService] Firebase Auth sign-in failed:', authError);
        // Continue anyway - user data is still valid locally
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
      // Fix Issue #249: Sign out from Firebase Auth to clear request.auth token
      console.log('[AuthService] Signing out from Firebase Auth');
      try {
        await this.firebaseAuth.signOut();
        console.log('[AuthService] Firebase Auth sign-out successful');
      } catch (authError: any) {
        console.error('[AuthService] Firebase Auth sign-out failed:', authError);
        // Continue with local logout anyway
      }

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

      // Fix Issue #249: Ensure Firebase Auth session is active during refresh
      // If user's session expired, re-establish Firebase Auth
      if (!this.firebaseAuth.currentUser) {
        console.log('[AuthService] Re-establishing Firebase Auth session during refresh');
        try {
          await signInAnonymously(this.firebaseAuth);
          console.log('[AuthService] Firebase Auth session re-established');
        } catch (authError: any) {
          console.error('[AuthService] Firebase Auth sign-in failed during refresh:', authError);
          // Continue anyway - user data is still valid locally
        }
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

  /**   * Check if user needs migration from custom user_id to Firebase UID.
   * Fix Issue #249: Detects legacy users created before Firebase Auth integration
   * @param user User to check
   * @returns True if user needs migration
   */
  private async checkIfUserNeedsMigration(user: User): Promise<boolean> {
    // If Firebase Auth is already signed in and UID matches user_id, no migration needed
    if (this.firebaseAuth.currentUser && this.firebaseAuth.currentUser.uid === user.user_id) {
      return false;
    }

    // Check if user_id looks like a custom generated ID (not Firebase UID format)
    // Firebase anonymous UIDs are typically 28 characters and alphanumeric
    // Custom IDs generated by doc().id are 20 characters
    const isLikelyCustomId = user.user_id.length === 20;

    if (isLikelyCustomId) {
      console.log('[AuthService] User appears to have legacy custom user_id:', user.user_id);
      return true;
    }

    return false;
  }

  /**
   * Migrate user from custom user_id to Firebase Auth UID.
   * Fix Issue #249: Preserves user data while upgrading to Firebase Auth
   * @param oldUser User with custom user_id
   * @returns Migrated user with Firebase UID
   */
  private async migrateUserToFirebaseAuth(oldUser: User): Promise<User | null> {
    console.log('[AuthService] Starting user migration for:', oldUser.user_id);

    try {
      // Step 1: Sign in anonymously to get Firebase UID
      console.log('[AuthService] Getting Firebase Auth UID for migration');
      const authResult = await signInAnonymously(this.firebaseAuth);
      const firebaseUid = authResult.user.uid;
      console.log('[AuthService] Firebase UID obtained:', firebaseUid);

      // Step 2: Create new user document with Firebase UID
      // Preserve all user data from old document
      const migrationData: UserRegistrationData = {
        rank: oldUser.rank,
        first_name: oldUser.first_name,
        last_name: oldUser.last_name,
        device_id: oldUser.device_id,
      };

      console.log('[AuthService] Creating new user document with Firebase UID');
      const migratedUser = await this.userService.createUser(migrationData, firebaseUid);

      // Step 3: Update local storage with new user_id
      await this.storage.setCurrentUser(migratedUser);
      console.log('[AuthService] Local storage updated with migrated user')

      // Step 4: Optionally mark old user document as migrated (for audit trail)
      // This is defensive - we keep old document for reference but don't use it
      try {
        await this.userService.markUserAsMigrated(oldUser.user_id, firebaseUid);
        console.log('[AuthService] Old user document marked as migrated');
      } catch (markError: any) {
        console.warn('[AuthService] Could not mark old document:', markError.message);
        // Non-fatal - migration still successful
      }

      console.log('[AuthService] Migration completed successfully');
      return migratedUser;

    } catch (error: any) {
      console.error('[AuthService] Migration failed:', error);
      throw new Error(`User migration failed: ${error.message}`);
    }
  }

  /**   * Get current user (synchronous).
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
