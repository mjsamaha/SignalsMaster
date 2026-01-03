import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSpinner
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import {
  PracticeResultsService,
  PracticePaginatedResult,
  PracticeHistoryOptions
} from '../../core/services/practice-results.service';
import { AuthService } from '../../core/services/auth.service';
import { PracticeResult } from '../../core/models/practice-result.model';
import { InfiniteScrollCustomEvent, RefresherCustomEvent } from '@ionic/angular';

/**
 * PracticeHistoryPage displays user's practice quiz history with pagination.
 * Phase 3: History & Progress Tracking with statistics and sorting.
 */
@Component({
  selector: 'app-practice-history',
  templateUrl: './practice-history.page.html',
  styleUrls: ['./practice-history.page.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonRefresher,
    IonRefresherContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonSpinner,
    CommonModule
  ]
})
export class PracticeHistoryPage implements OnInit, OnDestroy {
  results: PracticeResult[] = [];
  isLoading: boolean = false;
  hasMoreResults: boolean = true;
  lastDocument: any = null;
  totalResultsLoaded: number = 0;
  private batchSize: number = 20;
  private historySubscription: Subscription | null = null;

  // Statistics
  totalSessions: number = 0;
  averageAccuracy: number = 0;
  bestScore: number = 0;
  bestAccuracy: number = 0;

  // Sorting
  currentSortBy: 'completed_at' | 'accuracy' | 'score' = 'completed_at';
  currentSortOrder: 'desc' | 'asc' = 'desc';

  constructor(
    private practiceResultsService: PracticeResultsService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('[PracticeHistoryPage] ngOnInit called');

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      console.error('[PracticeHistoryPage] No authenticated user');
      this.router.navigate(['/registration']);
      return;
    }

    // Load initial batch
    this.loadInitialBatch();
  }

  ngOnDestroy(): void {
    if (this.historySubscription) {
      this.historySubscription.unsubscribe();
    }
  }

  /**
   * Load initial batch of practice history
   */
  private loadInitialBatch(): void {
    console.log('[PracticeHistoryPage] Loading initial batch, size:', this.batchSize);
    this.isLoading = true;

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.isLoading = false;
      return;
    }

    const options: PracticeHistoryOptions = {
      limit: this.batchSize,
      sortBy: this.currentSortBy,
      sortOrder: this.currentSortOrder
    };

    this.historySubscription = this.practiceResultsService
      .getPracticeHistoryInitial(currentUser.user_id, options)
      .subscribe({
        next: (result: PracticePaginatedResult) => {
          console.log('[PracticeHistoryPage] Initial batch loaded:', result.results.length, 'results');
          this.results = result.results;
          this.lastDocument = result.lastDoc;
          this.hasMoreResults = result.hasMore;
          this.totalResultsLoaded = result.results.length;
          this.calculateStatistics();
          this.isLoading = false;
        },
        error: error => {
          console.error('[PracticeHistoryPage] Failed to load initial batch:', error);
          this.isLoading = false;
        }
      });
  }

  /**
   * Load next batch of results when user scrolls to bottom
   */
  loadNextBatch(event: InfiniteScrollCustomEvent): void {
    console.log('[PracticeHistoryPage] Loading next batch');

    if (!this.lastDocument || !this.hasMoreResults) {
      event.target.complete();
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      event.target.complete();
      return;
    }

    const options: PracticeHistoryOptions = {
      limit: this.batchSize,
      sortBy: this.currentSortBy,
      sortOrder: this.currentSortOrder
    };

    this.practiceResultsService
      .getPracticeHistoryPaginated(currentUser.user_id, this.lastDocument, options)
      .subscribe({
        next: (result: PracticePaginatedResult) => {
          console.log('[PracticeHistoryPage] Next batch loaded:', result.results.length, 'results');
          this.results = [...this.results, ...result.results];
          this.lastDocument = result.lastDoc;
          this.hasMoreResults = result.hasMore;
          this.totalResultsLoaded += result.results.length;
          this.calculateStatistics();
          event.target.complete();
        },
        error: error => {
          console.error('[PracticeHistoryPage] Failed to load next batch:', error);
          event.target.complete();
        }
      });
  }

  /**
   * Handle pull-to-refresh gesture
   */
  handleRefresh(event: RefresherCustomEvent): void {
    console.log('[PracticeHistoryPage] Refreshing history');

    // Reset state
    this.results = [];
    this.lastDocument = null;
    this.hasMoreResults = true;
    this.totalResultsLoaded = 0;

    // Unsubscribe from previous subscription
    if (this.historySubscription) {
      this.historySubscription.unsubscribe();
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      event.target.complete();
      return;
    }

    const options: PracticeHistoryOptions = {
      limit: this.batchSize,
      sortBy: this.currentSortBy,
      sortOrder: this.currentSortOrder
    };

    // Reload initial batch
    this.historySubscription = this.practiceResultsService
      .getPracticeHistoryInitial(currentUser.user_id, options)
      .subscribe({
        next: (result: PracticePaginatedResult) => {
          console.log('[PracticeHistoryPage] Refresh complete:', result.results.length, 'results');
          this.results = result.results;
          this.lastDocument = result.lastDoc;
          this.hasMoreResults = result.hasMore;
          this.totalResultsLoaded = result.results.length;
          this.calculateStatistics();
          event.target.complete();
        },
        error: error => {
          console.error('[PracticeHistoryPage] Failed to refresh:', error);
          event.target.complete();
        }
      });
  }

  /**
   * Handle sort change
   */
  onSortChange(event: any): void {
    const newSortBy = event.detail.value as 'completed_at' | 'accuracy' | 'score';
    if (newSortBy === this.currentSortBy) {
      return;
    }

    console.log('[PracticeHistoryPage] Sort changed to:', newSortBy);
    this.currentSortBy = newSortBy;

    // Reload data with new sort
    this.results = [];
    this.lastDocument = null;
    this.hasMoreResults = true;
    this.totalResultsLoaded = 0;

    if (this.historySubscription) {
      this.historySubscription.unsubscribe();
    }

    this.loadInitialBatch();
  }

  /**
   * Calculate statistics from loaded results
   */
  private calculateStatistics(): void {
    if (this.results.length === 0) {
      this.totalSessions = 0;
      this.averageAccuracy = 0;
      this.bestScore = 0;
      this.bestAccuracy = 0;
      return;
    }

    this.totalSessions = this.results.length;
    this.averageAccuracy = this.results.reduce((sum, r) => sum + r.accuracy, 0) / this.results.length;
    this.bestScore = Math.max(...this.results.map(r => r.score));
    this.bestAccuracy = Math.max(...this.results.map(r => r.accuracy));
  }

  /**
   * Get performance tier based on accuracy
   */
  getPerformanceTier(accuracy: number): string {
    if (accuracy >= 90) return 'excellent';
    if (accuracy >= 75) return 'good';
    if (accuracy >= 60) return 'fair';
    return 'poor';
  }

  /**
   * Get performance tier label
   */
  getPerformanceTierLabel(accuracy: number): string {
    if (accuracy >= 90) return 'Excellent';
    if (accuracy >= 75) return 'Good';
    if (accuracy >= 60) return 'Fair';
    return 'Needs Practice';
  }

  /**
   * Get rank badge emoji based on rank
   */
  getRankBadge(rank: string): string {
    const rankUpper = rank.toUpperCase();
    switch (rankUpper) {
      case 'ADMIRAL':
        return '⭐⭐⭐⭐⭐';
      case 'CAPTAIN':
        return '⭐⭐⭐⭐';
      case 'LIEUTENANT':
        return '⭐⭐⭐';
      case 'ENSIGN':
        return '⭐⭐';
      case 'SEAMAN':
        return '⭐';
      default:
        return '⭐';
    }
  }

  /**
   * Format time in seconds to MM:SS
   */
  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Format date to readable string
   */
  formatDate(timestamp: any): string {
    if (!timestamp) return 'Unknown';

    let date: Date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else {
      return 'Unknown';
    }

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }

  /**
   * TrackBy function for ngFor optimization
   */
  trackByResultId(index: number, result: PracticeResult): string {
    return result.result_id;
  }

  /**
   * Navigate to practice mode to start a new quiz
   */
  startNewQuiz(): void {
    this.router.navigate(['/tabs/practice-mode']);
  }

  /**
   * Navigate back to home
   */
  goHome(): void {
    this.router.navigate(['/tabs/home']);
  }
}
