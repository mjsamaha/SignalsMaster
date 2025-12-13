/**
 * StorageService - Device storage wrapper using Capacitor Preferences.
 * Provides persistent storage for user session data across app launches.
 * Works on web (localStorage fallback), iOS, and Android.
 */

import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { User } from '../models/user.model';

/**
 * Storage keys used throughout the application.
 * Prefixed with 'sm_' to avoid conflicts with other apps/data.
 */
export const STORAGE_KEYS = {
  DEVICE_ID: 'sm_device_id',
  CURRENT_USER: 'sm_current_user',
  CURRENT_USER_ID: 'sm_current_user_id',
  LAST_SYNC: 'sm_last_sync',
  SESSION_TOKEN: 'sm_session_token', // For future use
} as const;

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor() {
    console.log('[StorageService] Initialized');
  }

  /**
   * Generate or retrieve device UUID.
   * UUID persists across app launches and is used to bind user to device.
   * @returns Device UUID string
   */
  async getOrCreateDeviceId(): Promise<string> {
    try {
      const { value } = await Preferences.get({ key: STORAGE_KEYS.DEVICE_ID });

      if (value) {
        console.log('[StorageService] Retrieved existing device ID');
        return value;
      }

      // Generate new UUID v4
      const newDeviceId = this.generateUUID();
      await Preferences.set({
        key: STORAGE_KEYS.DEVICE_ID,
        value: newDeviceId
      });

      console.log('[StorageService] Generated new device ID');
      return newDeviceId;
    } catch (error) {
      console.error('[StorageService] Error managing device ID:', error);
      throw new Error('Failed to get or create device ID');
    }
  }

  /**
   * Store current user object.
   * @param user User object to store
   */
  async setCurrentUser(user: User): Promise<void> {
    try {
      const userJson = JSON.stringify(user);

      await Promise.all([
        Preferences.set({
          key: STORAGE_KEYS.CURRENT_USER,
          value: userJson
        }),
        Preferences.set({
          key: STORAGE_KEYS.CURRENT_USER_ID,
          value: user.user_id
        }),
        Preferences.set({
          key: STORAGE_KEYS.LAST_SYNC,
          value: new Date().toISOString()
        })
      ]);

      console.log('[StorageService] Stored current user:', user.user_id);
    } catch (error) {
      console.error('[StorageService] Error storing user:', error);
      throw new Error('Failed to store user data');
    }
  }

  /**
   * Retrieve current user object.
   * @returns User object or null if not found
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const { value } = await Preferences.get({ key: STORAGE_KEYS.CURRENT_USER });

      if (!value) {
        console.log('[StorageService] No current user found');
        return null;
      }

      const user = JSON.parse(value) as User;
      console.log('[StorageService] Retrieved current user:', user.user_id);
      return user;
    } catch (error) {
      console.error('[StorageService] Error retrieving user:', error);
      return null;
    }
  }

  /**
   * Get current user ID (lightweight alternative to getting full user object).
   * @returns User ID string or null
   */
  async getCurrentUserId(): Promise<string | null> {
    try {
      const { value } = await Preferences.get({ key: STORAGE_KEYS.CURRENT_USER_ID });

      if (!value) {
        console.log('[StorageService] No current user ID found');
        return null;
      }

      console.log('[StorageService] Retrieved current user ID');
      return value;
    } catch (error) {
      console.error('[StorageService] Error retrieving user ID:', error);
      return null;
    }
  }

  /**
   * Clear current user data (logout).
   * Removes user object and user ID but preserves device ID.
   */
  async clearCurrentUser(): Promise<void> {
    try {
      await Promise.all([
        Preferences.remove({ key: STORAGE_KEYS.CURRENT_USER }),
        Preferences.remove({ key: STORAGE_KEYS.CURRENT_USER_ID }),
        Preferences.remove({ key: STORAGE_KEYS.SESSION_TOKEN })
      ]);

      console.log('[StorageService] Cleared current user data');
    } catch (error) {
      console.error('[StorageService] Error clearing user data:', error);
      throw new Error('Failed to clear user data');
    }
  }

  /**
   * Store session token (for future API authentication if needed).
   * @param token Session token string
   */
  async setSessionToken(token: string): Promise<void> {
    try {
      await Preferences.set({
        key: STORAGE_KEYS.SESSION_TOKEN,
        value: token
      });
      console.log('[StorageService] Stored session token');
    } catch (error) {
      console.error('[StorageService] Error storing session token:', error);
      throw new Error('Failed to store session token');
    }
  }

  /**
   * Retrieve session token.
   * @returns Session token string or null
   */
  async getSessionToken(): Promise<string | null> {
    try {
      const { value } = await Preferences.get({ key: STORAGE_KEYS.SESSION_TOKEN });
      return value;
    } catch (error) {
      console.error('[StorageService] Error retrieving session token:', error);
      return null;
    }
  }

  /**
   * Clear session token.
   */
  async clearSessionToken(): Promise<void> {
    try {
      await Preferences.remove({ key: STORAGE_KEYS.SESSION_TOKEN });
      console.log('[StorageService] Cleared session token');
    } catch (error) {
      console.error('[StorageService] Error clearing session token:', error);
      throw new Error('Failed to clear session token');
    }
  }

  /**
   * Get last sync timestamp.
   * @returns ISO date string or null
   */
  async getLastSync(): Promise<string | null> {
    try {
      const { value } = await Preferences.get({ key: STORAGE_KEYS.LAST_SYNC });
      return value;
    } catch (error) {
      console.error('[StorageService] Error retrieving last sync:', error);
      return null;
    }
  }

  /**
   * Generic method to store any key-value pair.
   * @param key Storage key
   * @param value Value to store (will be JSON stringified)
   */
  async set(key: string, value: any): Promise<void> {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await Preferences.set({ key, value: stringValue });
      console.log(`[StorageService] Stored key: ${key}`);
    } catch (error) {
      console.error(`[StorageService] Error storing key ${key}:`, error);
      throw new Error(`Failed to store ${key}`);
    }
  }

  /**
   * Generic method to retrieve any key.
   * @param key Storage key
   * @returns Value or null
   */
  async get(key: string): Promise<any> {
    try {
      const { value } = await Preferences.get({ key });

      if (!value) {
        return null;
      }

      // Try to parse as JSON, return as string if parsing fails
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.error(`[StorageService] Error retrieving key ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove a specific key from storage.
   * @param key Storage key to remove
   */
  async remove(key: string): Promise<void> {
    try {
      await Preferences.remove({ key });
      console.log(`[StorageService] Removed key: ${key}`);
    } catch (error) {
      console.error(`[StorageService] Error removing key ${key}:`, error);
      throw new Error(`Failed to remove ${key}`);
    }
  }

  /**
   * Clear all storage (use with caution).
   * This will clear ALL data including device ID.
   */
  async clear(): Promise<void> {
    try {
      await Preferences.clear();
      console.log('[StorageService] Cleared all storage');
    } catch (error) {
      console.error('[StorageService] Error clearing storage:', error);
      throw new Error('Failed to clear storage');
    }
  }

  /**
   * Get all keys currently in storage (for debugging).
   * @returns Array of storage keys
   */
  async keys(): Promise<string[]> {
    try {
      const { keys } = await Preferences.keys();
      return keys;
    } catch (error) {
      console.error('[StorageService] Error retrieving keys:', error);
      return [];
    }
  }

  /**
   * Generate UUID v4 for device identification.
   * @returns UUID string in format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
   * @private
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
