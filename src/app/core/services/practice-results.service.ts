/**
 * PracticeResultsService - Manages practice quiz results in Firestore.
 * MVP Phase 1: Handles submission of practice results for authenticated users.
 *
 * Collection: practice_results
 * Privacy: Users can only read/write their own practice results
 */

import { Injectable, NgZone, inject } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  QueryConstraint,
  getDocs,
  startAfter,
  QueryDocumentSnapshot,
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';
import {
  PracticeResult,
  PracticeResultSubmission,
  validatePracticeResultSubmission,
  practiceSummaryToSubmission,
} from '../models/practice-result.model';

/**
 * Response structure for practice result submission.
 */
export interface PracticeSubmissionResponse {
  success: boolean;
  message: string;
  resultId?: string; // Firestore document ID if successful
}

/**
 * Paginated result structure for history queries.
 * Used for infinite scroll implementation.
 */
export interface PracticePaginatedResult {
  results: PracticeResult[];
  lastDoc: QueryDocumentSnapshot | null;
  hasMore: boolean;
}

/**
 * Options for querying practice history.
 */
export interface PracticeHistoryOptions {
  limit?: number;
  sortBy?: 'completed_at' | 'accuracy' | 'score';
  sortOrder?: 'desc' | 'asc';
}

@Injectable({
  providedIn: 'root'
})
export class PracticeResultsService {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(Auth);
  private readonly ngZone = inject(NgZone);
  private readonly collectionName = 'practice_results';

  constructor() {
    console.log('[PracticeResultsService] Initialized with Firestore:', !!this.firestore);
    console.log('[PracticeResultsService] Auth instance:', !!this.auth);
  }

  /**
   * Submit practice quiz results to Firestore.
   * Validates data, adds server timestamps, and saves to practice_results collection.
   *
   * @param user Authenticated user submitting the results
   * @param summary Practice quiz summary from QuizService
   * @returns Promise with submission response
   */
  async submitPracticeResult(
    user: User,
    summary: {
      sessionId: string;
      totalQuestions: number;
      correctAnswers: number;
      accuracy: number;
      totalTime: number;
      averageTimePerQuestion: number;
    }
  ): Promise<PracticeSubmissionResponse> {
    console.log('[PracticeResultsService] submitPracticeResult called', {
      userId: user.user_id,
      sessionId: summary.sessionId,
      score: summary.correctAnswers,
      totalQuestions: summary.totalQuestions
    });

    try {
      // Check Firebase Auth state FIRST
      const currentAuthUser = this.auth.currentUser;
      console.log('[PracticeResultsService] Firebase Auth state:', {
        authUser: currentAuthUser ? currentAuthUser.uid : 'NULL',
        userIdFromParam: user.user_id,
        match: currentAuthUser?.uid === user.user_id
      });

      if (!currentAuthUser) {
        console.error('[PracticeResultsService] Firebase Auth user is NULL');
        return {
          success: false,
          message: 'Authentication error - please log in again'
        };
      }

      if (currentAuthUser.uid !== user.user_id) {
        console.error('[PracticeResultsService] Auth UID mismatch!', {
          authUid: currentAuthUser.uid,
          paramUserId: user.user_id
        });
        return {
          success: false,
          message: 'Authentication mismatch - please log in again'
        };
      }

      // Validate user
      if (!user || !user.user_id) {
        console.error('[PracticeResultsService] Invalid user data');
        return {
          success: false,
          message: 'User authentication required'
        };
      }

      // Convert summary to submission format
      const submission = practiceSummaryToSubmission(
        summary,
        user.user_id,
        user.rank
      );

      console.log('[PracticeResultsService] Converted summary to submission:', submission);

      // Validate submission data
      const validation = validatePracticeResultSubmission(submission);
      if (!validation.valid) {
        console.error('[PracticeResultsService] Validation failed:', validation.errors);
        return {
          success: false,
          message: `Validation failed: ${validation.errors.join(', ')}`
        };
      }

      console.log('[PracticeResultsService] Validation passed, preparing document data');

      // Prepare document data - MUST MATCH FIRESTORE RULES SCHEMA
      const docData = {
        user_id: submission.user_id,
        rank: submission.rank,
        score: submission.score,
        total_questions: submission.total_questions,
        accuracy: submission.accuracy,
        total_time: submission.total_time,
        average_time: submission.average_time,
        session_id: submission.session_id,
        completed_at: serverTimestamp(),
        created_at: serverTimestamp()
      };

      // Log COMPLETE document data for debugging
      console.log('[PracticeResultsService] Prepared COMPLETE document data:', docData);
      console.log('[PracticeResultsService] Document keys:', Object.keys(docData));
      console.log('[PracticeResultsService] Auth status:', {
        hasAuth: !!this.firestore.app.options,
        firestoreConfigured: !!this.firestore
      });

      console.log('[PracticeResultsService] Submitting to Firestore...');

      // Wrap Firestore operation in ngZone for proper Angular change detection
      const docRef = await this.ngZone.run(async () => {
        const ref = await addDoc(
          collection(this.firestore, this.collectionName),
          docData
        );
        return ref;
      });

      console.log('[PracticeResultsService] Document added successfully, ID:', docRef.id);

      return {
        success: true,
        message: 'Practice results saved successfully!',
        resultId: docRef.id
      };

    } catch (error: any) {
      console.error('[PracticeResultsService] Error submitting practice result:', {
        code: error.code || 'UNKNOWN',
        message: error.message || 'Unknown error',
        errorType: error.constructor?.name,
        fullError: error
      });

      // Handle specific Firebase errors
      if (error.code === 'permission-denied') {
        console.error('[PracticeResultsService] Permission denied - check Firestore security rules');
        return {
          success: false,
          message: 'Permission denied. Please ensure you are logged in.'
        };
      }

      if (error.code === 'invalid-argument') {
        console.error('[PracticeResultsService] Invalid argument - data validation failed in Firestore');
        return {
          success: false,
          message: 'Invalid data format. Please try again.'
        };
      }

      if (error.code === 'unavailable') {
        return {
          success: false,
          message: 'Network error. Please check your connection and try again.'
        };
      }

      return {
        success: false,
        message: 'Failed to save practice results. Please try again.'
      };
    }
  }

  /**
   * Get initial batch of practice history for a user with pagination.
   * Follows LeaderboardService pattern for consistent pagination implementation.
   *
   * @param userId The user's unique identifier
   * @param options Query options (limit, sort field, sort order)
   * @returns Observable with practice results, last document, and hasMore flag
   */
  getPracticeHistoryInitial(
    userId: string,
    options: PracticeHistoryOptions = {}
  ): Observable<PracticePaginatedResult> {
    const {
      limit: limitCount = 20,
      sortBy = 'completed_at',
      sortOrder = 'desc'
    } = options;

    console.log('[PracticeResultsService] getPracticeHistoryInitial called', {
      userId,
      limit: limitCount,
      sortBy,
      sortOrder
    });

    return new Observable<PracticePaginatedResult>(observer => {
      try {
        // Validate userId
        if (!userId || typeof userId !== 'string' || userId.length === 0) {
          console.error('[PracticeResultsService] Invalid userId:', userId);
          observer.error(new Error('Invalid user ID'));
          return () => {};
        }

        // Build query constraints
        const constraints: QueryConstraint[] = [
          where('user_id', '==', userId),
          orderBy(sortBy, sortOrder),
          limit(limitCount)
        ];

        const q = query(
          collection(this.firestore, this.collectionName),
          ...constraints
        );

        // Use getDocs for one-time fetch (not real-time)
        this.ngZone.run(async () => {
          try {
            const snapshot = await getDocs(q);
            console.log('[PracticeResultsService] Initial batch loaded:', snapshot.docs.length, 'results');

            const results = this.mapSnapshotToResults(snapshot.docs);
            const lastDoc = snapshot.docs.length > 0
              ? snapshot.docs[snapshot.docs.length - 1]
              : null;
            const hasMore = snapshot.docs.length === limitCount;

            observer.next({ results, lastDoc, hasMore });
            observer.complete();
          } catch (error) {
            console.error('[PracticeResultsService] Error loading initial batch:', error);
            observer.error(error);
          }
        });
      } catch (error) {
        console.error('[PracticeResultsService] Error setting up initial query:', error);
        observer.error(error);
      }

      return () => {};
    });
  }

  /**
   * Get next batch of practice history with pagination.
   * Uses startAfter cursor for efficient pagination.
   *
   * @param userId The user's unique identifier
   * @param lastVisible Last document from previous batch
   * @param options Query options (limit, sort field, sort order)
   * @returns Observable with practice results, last document, and hasMore flag
   */
  getPracticeHistoryPaginated(
    userId: string,
    lastVisible: QueryDocumentSnapshot,
    options: PracticeHistoryOptions = {}
  ): Observable<PracticePaginatedResult> {
    const {
      limit: limitCount = 20,
      sortBy = 'completed_at',
      sortOrder = 'desc'
    } = options;

    console.log('[PracticeResultsService] getPracticeHistoryPaginated called', {
      userId,
      limit: limitCount,
      sortBy,
      sortOrder
    });

    return new Observable<PracticePaginatedResult>(observer => {
      try {
        // Validate inputs
        if (!userId || !lastVisible) {
          console.error('[PracticeResultsService] Invalid pagination parameters');
          observer.error(new Error('Invalid pagination parameters'));
          return () => {};
        }

        // Build query constraints with startAfter cursor
        const constraints: QueryConstraint[] = [
          where('user_id', '==', userId),
          orderBy(sortBy, sortOrder),
          startAfter(lastVisible),
          limit(limitCount)
        ];

        const q = query(
          collection(this.firestore, this.collectionName),
          ...constraints
        );

        this.ngZone.run(async () => {
          try {
            const snapshot = await getDocs(q);
            console.log('[PracticeResultsService] Next batch loaded:', snapshot.docs.length, 'results');

            const results = this.mapSnapshotToResults(snapshot.docs);
            const lastDoc = snapshot.docs.length > 0
              ? snapshot.docs[snapshot.docs.length - 1]
              : null;
            const hasMore = snapshot.docs.length === limitCount;

            observer.next({ results, lastDoc, hasMore });
            observer.complete();
          } catch (error) {
            console.error('[PracticeResultsService] Error loading next batch:', error);
            observer.error(error);
          }
        });
      } catch (error) {
        console.error('[PracticeResultsService] Error setting up paginated query:', error);
        observer.error(error);
      }

      return () => {};
    });
  }

  /**
   * Map Firestore snapshot documents to PracticeResult objects.
   * Helper method for consistent data transformation.
   *
   * @param docs Array of Firestore query document snapshots
   * @returns Array of typed PracticeResult objects
   */
  private mapSnapshotToResults(docs: QueryDocumentSnapshot[]): PracticeResult[] {
    return docs.map(doc => {
      const data = doc.data() as any;

      return {
        result_id: doc.id,
        user_id: data.user_id || '',
        rank: data.rank || 'SEAMAN',
        score: data.score || 0,
        total_questions: data.total_questions || 0,
        accuracy: data.accuracy || 0,
        total_time: data.total_time || 0,
        average_time: data.average_time || 0,
        session_id: data.session_id || '',
        completed_at: data.completed_at,
        created_at: data.created_at
      };
    });
  }
}
