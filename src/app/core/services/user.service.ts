/**
 * UserService - Firestore CRUD operations for users collection.
 * Manages user data in Firestore including creation, retrieval, and updates.
 */

import { Injectable, inject, NgZone } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  CollectionReference,
  DocumentReference,
  QuerySnapshot,
  DocumentSnapshot
} from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  User,
  UserRegistrationData,
  UserUpdateData,
  ValidationResult,
  isValidRank
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly firestore = inject(Firestore);
  private readonly ngZone = inject(NgZone);
  private readonly usersCollection = 'users';

  constructor() {
    console.log('[UserService] Initialized with Firestore:', !!this.firestore);
  }

  /**
   * Create a new user in Firestore.
   * Fix Issue #249: Now accepts Firebase UID to ensure request.auth.uid matches user_id
   * @param data User registration data
   * @param firebaseUid Firebase Auth UID from anonymous sign-in
   * @returns Created user object with timestamps
   */
  async createUser(data: UserRegistrationData, firebaseUid: string): Promise<User> {
    console.log('[UserService] Creating user:', data);

    try {
      // Validate data before submission
      const validation = this.validateUserData(data);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Fix Issue #249: Use Firebase Auth UID instead of generating custom ID
      // This ensures Firestore rule 'request.auth.uid == user_id' validation passes
      console.log('[UserService] Using Firebase UID for user document:', firebaseUid);

      // Prepare user document with server timestamps
      const now = serverTimestamp();
      const userDoc = {
        user_id: firebaseUid,
        rank: data.rank.trim(),
        first_name: data.first_name.trim(),
        last_name: data.last_name.trim(),
        device_id: data.device_id,
        created_date: now,
        last_login: now,
      };

      console.log('[UserService] Prepared user document:', userDoc);

      // Create document in Firestore (wrapped in ngZone for change detection)
      // Fix Issue #249: Document ID matches Firebase Auth UID for security rule validation
      const docRef = await this.ngZone.run(async () => {
        const ref = doc(this.firestore, this.usersCollection, firebaseUid);
        await setDoc(ref, userDoc);
        console.log('[UserService] Document created with Firebase UID:', ref.id);
        return ref;
      });

      // Fetch the created document to get server-generated timestamps
      const createdDoc = await getDoc(docRef);
      const user = this.mapDocToUser(createdDoc);

      if (!user) {
        throw new Error('Failed to retrieve created user');
      }

      console.log('[UserService] User created successfully:', user.user_id);
      return user;

    } catch (error: any) {
      console.error('[UserService] Error creating user:', error);

      if (error.code === 'permission-denied') {
        throw new Error('Permission denied - check Firestore security rules');
      }

      if (error.code === 'invalid-argument') {
        throw new Error('Invalid data format - check field types and validation');
      }

      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  /**
   * Get user by user ID.
   * @param userId Firestore document ID
   * @returns User object or null if not found
   */
  async getUserById(userId: string): Promise<User | null> {
    console.log('[UserService] Fetching user by ID:', userId);

    try {
      const docRef = doc(this.firestore, this.usersCollection, userId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        console.log('[UserService] User not found:', userId);
        return null;
      }

      const user = this.mapDocToUser(docSnap);
      console.log('[UserService] User retrieved successfully:', userId);
      return user;

    } catch (error: any) {
      console.error('[UserService] Error fetching user by ID:', error);

      if (error.code === 'permission-denied') {
        throw new Error('Permission denied - check Firestore security rules');
      }

      throw new Error(`Failed to fetch user: ${error.message}`);
    }
  }

  /**
   * Get user by device ID.
   * Used to check if device is already registered.
   * @param deviceId Device UUID
   * @returns User object or null if not found
   */
  async getUserByDeviceId(deviceId: string): Promise<User | null> {
    console.log('[UserService] Fetching user by device ID');

    try {
      const q = query(
        collection(this.firestore, this.usersCollection),
        where('device_id', '==', deviceId),
        limit(1)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log('[UserService] No user found for device ID');
        return null;
      }

      const user = this.mapDocToUser(querySnapshot.docs[0]);
      console.log('[UserService] User found for device ID:', user?.user_id);
      return user;

    } catch (error: any) {
      console.error('[UserService] Error fetching user by device ID:', error);

      if (error.code === 'permission-denied') {
        throw new Error('Permission denied - check Firestore security rules');
      }

      throw new Error(`Failed to fetch user by device ID: ${error.message}`);
    }
  }

  /**
   * Get all users (for admin dashboard - Phase 4).
   * Returns an observable that emits array of users.
   * @returns Observable of User array
   */
  getAllUsers(): Observable<User[]> {
    console.log('[UserService] Fetching all users');

    return from(
      getDocs(
        query(
          collection(this.firestore, this.usersCollection),
          orderBy('created_date', 'desc')
        )
      )
    ).pipe(
      map((querySnapshot: QuerySnapshot) => {
        const users: User[] = [];
        querySnapshot.forEach((doc) => {
          const user = this.mapDocToUser(doc);
          if (user) {
            users.push(user);
          }
        });
        console.log('[UserService] Retrieved users count:', users.length);
        return users;
      })
    );
  }

  /**
   * Get total count of users (for admin dashboard - Phase 4).
   * @returns Observable of user count
   */
  getUsersCount(): Observable<number> {
    console.log('[UserService] Fetching users count');

    return this.getAllUsers().pipe(
      map(users => users.length)
    );
  }

  /**
   * Update user profile fields.
   * Allows updating rank, first_name, and last_name.
   * @param userId User document ID
   * @param updates Partial user data to update
   */
  async updateUser(userId: string, updates: UserUpdateData): Promise<void> {
    console.log('[UserService] Updating user:', userId, updates);

    try {
      // Validate updates
      if (updates.rank && !isValidRank(updates.rank)) {
        throw new Error(`Invalid rank: ${updates.rank}`);
      }

      if (updates.first_name && (updates.first_name.length < 1 || updates.first_name.length > 50)) {
        throw new Error('First name must be between 1 and 50 characters');
      }

      if (updates.last_name && (updates.last_name.length < 1 || updates.last_name.length > 50)) {
        throw new Error('Last name must be between 1 and 50 characters');
      }

      // Trim string fields
      const trimmedUpdates: any = { ...updates };
      if (trimmedUpdates.first_name) {
        trimmedUpdates.first_name = trimmedUpdates.first_name.trim();
      }
      if (trimmedUpdates.last_name) {
        trimmedUpdates.last_name = trimmedUpdates.last_name.trim();
      }
      if (trimmedUpdates.rank) {
        trimmedUpdates.rank = trimmedUpdates.rank.trim();
      }

      const docRef = doc(this.firestore, this.usersCollection, userId);

      await this.ngZone.run(async () => {
        await updateDoc(docRef, trimmedUpdates);
      });

      console.log('[UserService] User updated successfully:', userId);

    } catch (error: any) {
      console.error('[UserService] Error updating user:', error);

      if (error.code === 'permission-denied') {
        throw new Error('Permission denied - check Firestore security rules');
      }

      if (error.code === 'not-found') {
        throw new Error('User not found');
      }

      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  /**
   * Update user's last login timestamp.
   * Called on app startup when user auto-logs in.
   * @param userId User document ID
   */
  async updateLastLogin(userId: string): Promise<void> {
    console.log('[UserService] Updating last login for user:', userId);

    try {
      const docRef = doc(this.firestore, this.usersCollection, userId);

      await this.ngZone.run(async () => {
        await updateDoc(docRef, {
          last_login: serverTimestamp()
        });
      });

      console.log('[UserService] Last login updated successfully:', userId);

    } catch (error: any) {
      console.error('[UserService] Error updating last login:', error);

      // Don't throw error for last_login updates to avoid blocking app startup
      console.warn('[UserService] Continuing despite last_login update failure');
    }
  }

  /**
   * Mark user document as migrated to Firebase Auth.
   * Fix Issue #249: Adds migration metadata to legacy user documents
   * @param oldUserId Legacy custom user_id
   * @param newFirebaseUid New Firebase Auth UID
   */
  async markUserAsMigrated(oldUserId: string, newFirebaseUid: string): Promise<void> {
    console.log('[UserService] Marking user as migrated:', oldUserId, '→', newFirebaseUid);

    try {
      const docRef = doc(this.firestore, this.usersCollection, oldUserId);

      await this.ngZone.run(async () => {
        await updateDoc(docRef, {
          migrated_to_firebase_uid: newFirebaseUid,
          migrated_at: serverTimestamp(),
          is_legacy: true
        });
      });

      console.log('[UserService] User marked as migrated successfully');

    } catch (error: any) {
      console.error('[UserService] Error marking user as migrated:', error);
      // Non-fatal error - throw to let caller handle
      throw new Error(`Failed to mark user as migrated: ${error.message}`);
    }
  }

  /**
   * Deactivate user (soft delete).
   * Sets is_admin to false and could add is_active flag in future.
   * @param userId User document ID
   */
  async deactivateUser(userId: string): Promise<void> {
    console.log('[UserService] Deactivating user:', userId);

    try {
      const docRef = doc(this.firestore, this.usersCollection, userId);

      await this.ngZone.run(async () => {
        await updateDoc(docRef, {
          is_admin: false,
          // Future: is_active: false
        });
      });

      console.log('[UserService] User deactivated successfully:', userId);

    } catch (error: any) {
      console.error('[UserService] Error deactivating user:', error);
      throw new Error(`Failed to deactivate user: ${error.message}`);
    }
  }

  /**
   * Validate user registration data.
   * Checks for required fields, types, and constraints.
   * @param data User registration data
   * @returns Validation result with errors array
   */
  validateUserData(data: UserRegistrationData): ValidationResult {
    const errors: string[] = [];

    // Check required fields
    if (!data.rank) {
      errors.push('Rank is required');
    } else if (!isValidRank(data.rank)) {
      errors.push('Invalid rank value');
    }

    if (!data.first_name) {
      errors.push('First name is required');
    } else if (data.first_name.trim().length < 1 || data.first_name.trim().length > 50) {
      errors.push('First name must be between 1 and 50 characters');
    }

    if (!data.last_name) {
      errors.push('Last name is required');
    } else if (data.last_name.trim().length < 1 || data.last_name.trim().length > 50) {
      errors.push('Last name must be between 1 and 50 characters');
    }

    // device_id is optional - will be auto-generated if not provided
    if (data.device_id && data.device_id.length < 10) {
      errors.push('Device ID must be at least 10 characters');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Map Firestore document to User object.
   * Handles timestamp conversion and type safety.
   * @param doc Firestore document snapshot
   * @returns User object or null if mapping fails
   * @private
   */
  private mapDocToUser(doc: DocumentSnapshot): User | null {
    if (!doc.exists()) {
      return null;
    }

    try {
      const data = doc.data();

      if (!data) {
        return null;
      }

      return {
        user_id: doc.id,
        rank: data['rank'] || '',
        first_name: data['first_name'] || '',
        last_name: data['last_name'] || '',
        device_id: data['device_id'] || '',
        created_date: data['created_date'] as Timestamp,
        last_login: data['last_login'] as Timestamp,
        is_admin: data['is_admin'] || false,
      };
    } catch (error) {
      console.error('[UserService] Error mapping document to user:', error);
      return null;
    }
  }
}
