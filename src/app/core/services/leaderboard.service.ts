import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot, DocumentData } from '@angular/fire/firestore';
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
  private firestore: Firestore = inject(Firestore);

  constructor() {}

  /**
   * Submit competitive results to Firestore
   */
  async submitScore(results: CompetitiveResults): Promise<SubmissionResponse> {
    try {
      // Client validation
      if (!this.validateResults(results)) {
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

      // Add to Firestore
      const leaderboardRef = collection(this.firestore, 'leaderboard');
      await addDoc(leaderboardRef, docData);

      return { success: true, message: 'Score submitted successfully!' };

    } catch (error: any) {
      console.error('Error submitting score:', error);
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
    return new Observable<LeaderboardEntry[]>(observer => {
      const leaderboardRef = collection(this.firestore, 'leaderboard');
      const q = query(leaderboardRef, orderBy('rating', 'desc'), orderBy('createdAt', 'asc'), limit(100));

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const entries: LeaderboardEntry[] = querySnapshot.docs.map((doc, index) => {
          const data = doc.data();
          const rank = index + 1;
          const tier = this.getTierLabel(rank);

          return {
            id: doc.id,
            username: data['username'],
            rating: data['rating'],
            accuracy: data['accuracy'],
            totalTime: data['totalTime'],
            correctAnswers: data['correctAnswers'],
            totalQuestions: data['totalQuestions'],
            timestamp: data['createdAt']?.toDate()?.getTime() || Date.now(),
            rank: rank,
            tier: tier,
            sessionId: data['sessionId']
          };
        });

        observer.next(entries);
      }, (error) => {
        console.error('Leaderboard listener error:', error);
        observer.error(error);
      });

      // Return unsubscribe function
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
    if (results.finalRating < 0 || results.finalRating > 100) {
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
