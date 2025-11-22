import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { QuizResult } from './quiz.service';

export interface LeaderboardEntry {
  id: string;
  username: string;
  score: number;
  totalQuestions: number;
  accuracy: number;
  timeElapsed: number;
  rating: number;
  date: Date;
}

@Injectable({
  providedIn: 'root'
})
export class LeaderboardService {
  private leaderboard$ = new BehaviorSubject<LeaderboardEntry[]>([]);
  private readonly STORAGE_KEY = 'signalsmaster_leaderboard';

  constructor() {
    this.loadLeaderboard();
  }

  /**
   * Add a quiz result to the leaderboard
   */
  addResult(result: QuizResult): void {
    if (result.mode !== 'competition' || !result.username) {
      return; // Only add competition results with username
    }

    const entry: LeaderboardEntry = {
      id: this.generateId(),
      username: result.username,
      score: result.score,
      totalQuestions: result.totalQuestions,
      accuracy: (result.correctAnswers / result.totalQuestions) * 100,
      timeElapsed: result.timeElapsed,
      rating: this.calculateRating(result),
      date: new Date()
    };

    const currentLeaderboard = this.leaderboard$.value;
    const updatedLeaderboard = [...currentLeaderboard, entry]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 100); // Keep top 100

    this.leaderboard$.next(updatedLeaderboard);
    this.saveLeaderboard();
  }

  /**
   * Get leaderboard entries
   */
  getLeaderboard(): Observable<LeaderboardEntry[]> {
    return this.leaderboard$.asObservable();
  }

  /**
   * Get top N entries
   */
  getTopEntries(count: number = 10): Observable<LeaderboardEntry[]> {
    return new Observable(observer => {
      this.leaderboard$.subscribe(entries => {
        observer.next(entries.slice(0, count));
      });
    });
  }

  /**
   * Get user's rank
   */
  getUserRank(username: string): Observable<number> {
    return new Observable(observer => {
      this.leaderboard$.subscribe(entries => {
        const index = entries.findIndex(entry => entry.username === username);
        observer.next(index >= 0 ? index + 1 : -1);
      });
    });
  }

  /**
   * Clear leaderboard (for testing/admin)
   */
  clearLeaderboard(): void {
    this.leaderboard$.next([]);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Calculate rating based on score, accuracy, and time
   */
  private calculateRating(result: QuizResult): number {
    const accuracy = (result.correctAnswers / result.totalQuestions) * 100;
    const timeBonus = Math.max(0, 1000 - (result.timeElapsed / 1000)); // Time in seconds
    const baseScore = result.score * 10;
    
    return Math.round(baseScore + (accuracy * 2) + (timeBonus * 0.1));
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Load leaderboard from localStorage
   */
  private loadLeaderboard(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const entries = JSON.parse(stored).map((entry: any) => ({
          ...entry,
          date: new Date(entry.date)
        }));
        this.leaderboard$.next(entries);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  }

  /**
   * Save leaderboard to localStorage
   */
  private saveLeaderboard(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.leaderboard$.value));
    } catch (error) {
      console.error('Error saving leaderboard:', error);
    }
  }
}

