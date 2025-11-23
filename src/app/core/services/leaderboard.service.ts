import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, orderBy, limit, onSnapshot, query, serverTimestamp } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NgZone } from '@angular/core';
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

  constructor(private firestore: Firestore, private ngZone: NgZone) {}

  /**
   * Submit competitive results to Firestore
   */
  async submitScore(results: CompetitiveResults): Promise<SubmissionResponse> {
    console.log('[DEBUG] LeaderboardService.submitScore called with:', results);

    try {
      // Client validation
      if (!this.validateResults(results)) {
        console.log('[DEBUG] Validation failed for results:', results);
        return { success: false, message: 'Invalid submission data' };
      }

      // Prepare document data
      const docData = {
        username: results.username,
        accuracy: results.accuracy,
        rating: results.finalRating,
        totalTime: results.totalTime,
        correctAnswers: results.correctAnswers,
        totalQuestions: results.totalQuestions,
        sessionId: results.sessionId,
        createdAt: serverTimestamp()
      };

      console.log('[DEBUG] Prepared document data:', docData);

      // Add to Firestore
      const docRef = await addDoc(collection(this.firestore, 'leaderboard'), docData);
      console.log('[DEBUG] Document added successfully, ID:', docRef.id);

      return { success: true, message: 'Score submitted successfully!' };

    } catch (error: any) {
      console.error('[DEBUG] Error submitting score:', {
        code: error.code,
        message: error.message,
        fullError: error
      });

      if (error.code === 'permission-denied') {
        return { success: false, message: 'Submission failed - duplicate session or invalid data' };
      }
      return { success: false, message: 'Failed to submit score. Please try again.' };
    }
  }

  /**
   * Get real-time leaderboard from Firestore
   */
  getLeaderboard(): Observable<LeaderboardEntry[]> {
    console.log('[DEBUG] LeaderboardService.getLeaderboard called');

    return new Observable<LeaderboardEntry[]>(observer => {
      console.log('[DEBUG] Creating leaderboard query');

      const q = query(
        collection(this.firestore, 'leaderboard'),
        orderBy('rating', 'desc'),
        orderBy('createdAt', 'asc'),
        limit(100)
      );

      console.log('[DEBUG] Query created, setting up listener');

      const unsubscribe = onSnapshot(q, (snapshot) => {
        console.log('[DEBUG] onSnapshot fired, docs count:', snapshot.docs.length);

        const entries: LeaderboardEntry[] = snapshot.docs.map((doc, index) => {
          const data = doc.data() as any;
          const rank = index + 1;
          const tier = this.getTierLabel(rank);

          return {
            id: doc.id,
            username: data.username,
            rating: data.rating,
            accuracy: data.accuracy,
            totalTime: data.totalTime,
            correctAnswers: data.correctAnswers,
            totalQuestions: data.totalQuestions,
            timestamp: data.createdAt?.toDate()?.getTime() || Date.now(),
            rank,
            tier,
            sessionId: data.sessionId
          };
        });

        console.log('[DEBUG] Processed entries:', entries.length, entries.slice(0, 1));

        this.ngZone.run(() => observer.next(entries));
      }, (error) => {
        console.error('[DEBUG] Leaderboard listener error:', {
          code: error.code,
          message: error.message,
          fullError: error
        });
        observer.error(error);
      });

      return { unsubscribe };
    });
  }

  /**
   * Validate competitive results before submission
   */
  private validateResults(results: CompetitiveResults): boolean {
    if (!results.username || results.username.length < 3 || results.username.length > 20) {
      return false;
    }
    if (results.finalRating < 0 || results.finalRating > 5000) {
      return false;
    }
    if (results.accuracy < 0 || results.accuracy > 100) {
      return false;
    }
    if (results.totalTime <= 0) {
      return false;
    }
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
