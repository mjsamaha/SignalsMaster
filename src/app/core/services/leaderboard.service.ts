import { Injectable, NgZone, inject } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  orderBy,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  QueryConstraint
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CompetitiveResults } from './quiz.service';

export interface LeaderboardEntry {
  id: string;
  username: string;
  rating: number;
  accuracy: number;
  totalTime: number;
  correctAnswers: number;
  totalQuestions: number;
  timestamp: number;
  rank: number;
  tier: string;
  sessionId: string;
}

export interface SubmissionResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class LeaderboardService {
  private readonly firestore = inject(Firestore);
  private readonly ngZone = inject(NgZone);

  constructor() {
    console.log('[DEBUG] LeaderboardService constructor called, firestore:', !!this.firestore);
  }

  /**
   * Submit competitive results to Firestore
   */
  async submitScore(results: CompetitiveResults): Promise<SubmissionResponse> {
    console.log('[DEBUG] LeaderboardService.submitScore called with:', results);
    console.log('[DEBUG] submitScore - Results check:', {
      hasResults: !!results,
      username: results?.username,
      finalRating: results?.finalRating,
      sessionId: results?.sessionId
    });

    try {
      // Validate results
      if (!this.validateResults(results)) {
        console.log('[DEBUG] Validation failed for results:', results);
        return { success: false, message: 'Invalid submission data' };
      }

      console.log('[DEBUG] Validation passed, preparing document data');

      // Prepare document data - MUST MATCH FIRESTORE RULES SCHEMA
      const docData = {
        username: results.username.trim(), // Ensure string, trim whitespace
        rating: Math.round(results.finalRating), // Ensure number
        accuracy: Math.round(results.accuracy), // Ensure number
        totalTime: Math.round(results.totalTime), // Ensure number (seconds)
        correctAnswers: results.correctAnswers, // number
        totalQuestions: results.totalQuestions, // number (should be 50)
        sessionId: results.sessionId, // string
        createdAt: serverTimestamp() // Firestore server timestamp
      };

      console.log('[DEBUG] Prepared document data:', {
        username: docData.username,
        rating: docData.rating,
        accuracy: docData.accuracy,
        totalTime: docData.totalTime,
        correctAnswers: docData.correctAnswers,
        totalQuestions: docData.totalQuestions,
        sessionId: docData.sessionId,
        createdAt: '[serverTimestamp]'
      });

      console.log('[DEBUG] About to call addDoc with ngZone.run...');

      // Wrap Firestore operation in ngZone for proper Angular change detection
      const docRef = await this.ngZone.run(async () => {
        console.log('[DEBUG] Inside ngZone.run, calling addDoc...');
        const ref = await addDoc(collection(this.firestore, 'leaderboard'), docData);
        console.log('[DEBUG] addDoc returned, docRef:', ref);
        return ref;
      });

      console.log('[DEBUG] Document added successfully, ID:', docRef.id);
      console.log('[DEBUG] Full document ref:', docRef.path);
      console.log('[DEBUG] Document write completed, returning success response');

      return {
        success: true,
        message: 'Score submitted successfully!'
      };

    } catch (error: any) {
      console.error('[DEBUG] CATCH BLOCK: Error submitting score:', {
        code: error.code || 'UNKNOWN',
        message: error.message || 'Unknown error',
        errorType: error.constructor?.name,
        fullError: error
      });

      // Handle specific Firebase errors
      if (error.code === 'permission-denied') {
        console.error('[DEBUG] Permission denied - check Firestore security rules');
        return {
          success: false,
          message: 'Permission denied - check security rules'
        };
      }

      if (error.code === 'invalid-argument') {
        console.error('[DEBUG] Invalid argument - data validation failed in Firestore');
        return {
          success: false,
          message: 'Invalid data format - check rules'
        };
      }

      return {
        success: false,
        message: 'Failed to submit score. Please try again.'
      };
    }
  }

  /**
   * Get real-time leaderboard from Firestore
   */
  getLeaderboard(): Observable<LeaderboardEntry[]> {
    console.log('[DEBUG] LeaderboardService.getLeaderboard called');

    return new Observable<LeaderboardEntry[]>(observer => {
      console.log('[DEBUG] Creating leaderboard query');

      try {
        // Build query constraints
        const constraints: QueryConstraint[] = [
          orderBy('rating', 'desc'),   // Sort by rating descending
          orderBy('createdAt', 'asc'), // Then by timestamp ascending
          limit(100)                    // Limit to 100 documents
        ];

        console.log('[DEBUG] Firestore instance check:', {
          firestoreExists: !!this.firestore,
          type: typeof this.firestore
        });

        const q = query(collection(this.firestore, 'leaderboard'), ...constraints);

        console.log('[DEBUG] Query created, setting up listener');
        console.log('[DEBUG] Calling onSnapshot');

        // onSnapshot runs in the correct injection context when called here
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            console.log('[DEBUG] onSnapshot fired, docs count:', snapshot.docs.length);

            try {
              const entries: LeaderboardEntry[] = snapshot.docs.map((doc, index) => {
                const data = doc.data() as any;
                const rank = index + 1;
                const tier = this.getTierLabel(rank);

                return {
                  id: doc.id,
                  username: data.username || 'Anonymous',
                  rating: data.rating || 0,
                  accuracy: data.accuracy || 0,
                  totalTime: data.totalTime || 0,
                  correctAnswers: data.correctAnswers || 0,
                  totalQuestions: data.totalQuestions || 0,
                  timestamp: data.createdAt?.toDate?.()?.getTime() || Date.now(),
                  rank,
                  tier,
                  sessionId: data.sessionId || ''
                };
              });

              console.log('[DEBUG] Processed entries:', entries.length,
                entries.length > 0 ? entries[0] : 'no entries');

              // Emit data back to Angular zone for change detection
              this.ngZone.run(() => observer.next(entries));
            } catch (mapError) {
              console.error('[DEBUG] Error mapping snapshot documents:', mapError);
              this.ngZone.run(() => observer.error(mapError));
            }
          },
          (error) => {
            console.error('[DEBUG] Leaderboard listener error:', {
              code: error.code || 'UNKNOWN',
              message: error.message || 'Unknown error',
              fullError: error
            });
            this.ngZone.run(() => observer.error(error));
          }
        );

        // Return unsubscribe function
        return unsubscribe;
      } catch (error) {
        console.error('[DEBUG] Error setting up leaderboard listener:', error);
        observer.error(error);
      }
    });
  }

  /**
   * Validate competitive results before submission
   */
  private validateResults(results: CompetitiveResults): boolean {
    console.log('[DEBUG] Validating results:', {
      username: results?.username,
      finalRating: results?.finalRating,
      accuracy: results?.accuracy,
      totalTime: results?.totalTime,
      sessionId: results?.sessionId
    });

    if (!results) {
      console.log('[DEBUG] Validation: results is null/undefined');
      return false;
    }

    // Username validation
    const usernameValid = results.username && typeof results.username === 'string' &&
                          results.username.length >= 3 && results.username.length <= 20;
    console.log('[DEBUG] Validation: username =', results.username,
                '(length:', results.username?.length || 0, 'valid:', usernameValid + ')');
    if (!usernameValid) {
      console.log('[DEBUG] Validation failed: invalid username');
      return false;
    }

    // Rating validation
    const ratingValid = typeof results.finalRating === 'number' && results.finalRating >= 0 && results.finalRating <= 5000;
    console.log('[DEBUG] Validation: rating =', results.finalRating, '(valid:', ratingValid + ')');
    if (!ratingValid) {
      console.log('[DEBUG] Validation failed: invalid rating');
      return false;
    }

    // Accuracy validation (0-100%)
    const accuracyValid = typeof results.accuracy === 'number' && results.accuracy >= 0 && results.accuracy <= 100;
    console.log('[DEBUG] Validation: accuracy =', results.accuracy, '(valid:', accuracyValid + ')');
    if (!accuracyValid) {
      console.log('[DEBUG] Validation failed: invalid accuracy');
      return false;
    }

    // Time validation
    const timeValid = typeof results.totalTime === 'number' && results.totalTime > 0;
    console.log('[DEBUG] Validation: totalTime =', results.totalTime, '(valid:', timeValid + ')');
    if (!timeValid) {
      console.log('[DEBUG] Validation failed: invalid totalTime');
      return false;
    }

    // Session ID validation
    const sessionIdValid = results.sessionId && typeof results.sessionId === 'string' && results.sessionId.length > 0;
    console.log('[DEBUG] Validation: sessionId exists =', sessionIdValid);
    if (!sessionIdValid) {
      console.log('[DEBUG] Validation failed: invalid sessionId');
      return false;
    }

    console.log('[DEBUG] Validation passed for all fields');
    return true;
  }

  /**
   * Get tier label based on rank
   */
  private getTierLabel(rank: number): string {
    if (rank === 1) return 'Signals Master';
    if (rank <= 10) return 'Top Signaller';
    return '';
  }
}
