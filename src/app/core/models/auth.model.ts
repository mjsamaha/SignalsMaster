/**
 * Authentication-related models and interfaces.
 * Defines structures for authentication state, results, and validation.
 */

import { User } from './user.model';

/**
 * Result returned from authentication operations.
 * Used by AuthService methods to indicate success/failure.
 */
export interface AuthResult {
  success: boolean;              // Operation succeeded or failed
  user?: User;                   // User object if successful
  error?: string;                // Error message if failed
  requiresRegistration?: boolean; // Flag indicating user needs to register
}

/**
 * Current authentication state.
 * Managed by AuthService and exposed via observables.
 */
export interface AuthState {
  user: User | null;             // Current authenticated user
  loading: boolean;              // Auth operations in progress
  initialized: boolean;          // Auth system initialization complete
  error: string | null;          // Current error message if any
}

/**
 * Validation result for user registration data.
 * Used to validate form inputs before submission.
 */
export interface ValidationResult {
  valid: boolean;                // Data passes validation
  errors: string[];              // Array of validation error messages
}

/**
 * Session information stored on device.
 * Used for session persistence and recovery.
 */
export interface SessionInfo {
  user_id: string;               // User's Firestore document ID
  device_id: string;             // Device UUID
  last_sync: Date;               // Last successful sync with Firestore
  session_start: Date;           // When current session started
}

/**
 * Error types for authentication operations.
 * Used for consistent error handling across the app.
 */
export enum AuthErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  FIRESTORE_ERROR = 'FIRESTORE_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  DUPLICATE_USER = 'DUPLICATE_USER',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Structured error object for authentication errors.
 */
export interface AuthError {
  type: AuthErrorType;
  message: string;
  details?: any;                 // Additional error context
  timestamp: Date;
}

/**
 * Configuration for authentication behavior.
 * Can be extended in future phases.
 */
export interface AuthConfig {
  autoLogin: boolean;            // Automatically login returning users
  sessionTimeout?: number;       // Session timeout in milliseconds (optional)
  requiresOnboarding?: boolean;  // Show onboarding for new users
}
