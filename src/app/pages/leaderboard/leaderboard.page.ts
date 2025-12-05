import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonInfiniteScroll, IonInfiniteScrollContent, IonRefresher, IonRefresherContent } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { LeaderboardService, LeaderboardEntry, PaginatedResult } from '../../core/services/leaderboard.service';
import { InfiniteScrollCustomEvent, RefresherCustomEvent } from '@ionic/angular';

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.page.html',
  styleUrls: ['./leaderboard.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonInfiniteScroll, IonInfiniteScrollContent, IonRefresher, IonRefresherContent, CommonModule]
})
export class LeaderboardPage implements OnInit, OnDestroy {
  entries: LeaderboardEntry[] = [];
  isLoading: boolean = false;
  hasMoreEntries: boolean = true;
  lastDocument: any = null;
  totalEntriesLoaded: number = 0;
  private batchSize: number = 20;
  private leaderboardSubscription: Subscription | null = null;
  private currentUsername: string | null = null;

  constructor(
    private leaderboardService: LeaderboardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('[DEBUG] LeaderboardPage.ngOnInit() called');

    // Retrieve current user from localStorage (if exists from recent competitive session)
    this.currentUsername = localStorage.getItem('lastCompetitiveUsername');

    // Set responsive batch size based on viewport
    this.batchSize = this.getBatchSize();

    // Load initial batch
    this.loadInitialBatch();
  }

  ngOnDestroy(): void {
    if (this.leaderboardSubscription) {
      this.leaderboardSubscription.unsubscribe();
    }
  }

  /**
   * Load initial batch of leaderboard entries
   */
  private loadInitialBatch(): void {
    console.log('[DEBUG] Loading initial batch, size:', this.batchSize);
    this.isLoading = true;

    this.leaderboardSubscription = this.leaderboardService.getLeaderboardInitial(this.batchSize).subscribe({
      next: (result: PaginatedResult) => {
        console.log('[DEBUG] Initial batch loaded:', result.entries.length, 'entries');
        this.entries = result.entries;
        this.lastDocument = result.lastDoc;
        this.hasMoreEntries = result.hasMore;
        this.totalEntriesLoaded = result.entries.length;
        this.isLoading = false;
      },
      error: error => {
        console.error('[DEBUG] Failed to load initial batch:', error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Load next batch of entries when user scrolls to bottom
   * @param event Infinite scroll event from ion-infinite-scroll
   */
  loadNextBatch(event: InfiniteScrollCustomEvent): void {
    console.log('[DEBUG] Loading next batch, starting rank:', this.totalEntriesLoaded + 1);

    if (!this.lastDocument || !this.hasMoreEntries) {
      event.target.complete();
      return;
    }

    const startingRank = this.totalEntriesLoaded + 1;

    this.leaderboardService.getLeaderboardPaginated(this.lastDocument, this.batchSize, startingRank).subscribe({
      next: (result: PaginatedResult) => {
        console.log('[DEBUG] Next batch loaded:', result.entries.length, 'entries');
        this.entries = [...this.entries, ...result.entries];
        this.lastDocument = result.lastDoc;
        this.hasMoreEntries = result.hasMore;
        this.totalEntriesLoaded += result.entries.length;
        event.target.complete();
      },
      error: error => {
        console.error('[DEBUG] Failed to load next batch:', error);
        event.target.complete();
      }
    });
  }

  /**
   * Handle pull-to-refresh gesture
   * @param event Refresher event from ion-refresher
   */
  handleRefresh(event: RefresherCustomEvent): void {
    console.log('[DEBUG] Refreshing leaderboard');

    // Reset state
    this.entries = [];
    this.lastDocument = null;
    this.hasMoreEntries = true;
    this.totalEntriesLoaded = 0;

    // Unsubscribe from previous subscription
    if (this.leaderboardSubscription) {
      this.leaderboardSubscription.unsubscribe();
    }

    // Reload initial batch
    this.leaderboardSubscription = this.leaderboardService.getLeaderboardInitial(this.batchSize).subscribe({
      next: (result: PaginatedResult) => {
        console.log('[DEBUG] Refresh complete:', result.entries.length, 'entries');
        this.entries = result.entries;
        this.lastDocument = result.lastDoc;
        this.hasMoreEntries = result.hasMore;
        this.totalEntriesLoaded = result.entries.length;
        event.target.complete();
      },
      error: error => {
        console.error('[DEBUG] Failed to refresh:', error);
        event.target.complete();
      }
    });
  }

  /**
   * Get responsive batch size based on viewport width
   * @returns Batch size optimized for current device
   */
  private getBatchSize(): number {
    const width = window.innerWidth;
    if (width >= 1440) return 50;      // Ultra-wide desktop
    if (width >= 1024) return 30;      // Desktop/tablet landscape
    if (width >= 768) return 25;       // Tablet portrait
    return 20;                          // Mobile
  }

  /**
   * TrackBy function for ngFor optimization
   * @param index Index of item
   * @param entry Leaderboard entry
   * @returns Unique identifier for entry
   */
  trackByEntryId(index: number, entry: LeaderboardEntry): string {
    return entry.id;
  }

  /**
   * Get tier-based badge for each rank
   * Tier 1: 🥇 (Rank #1 - Signals Master)
   * Tier 2: 🥈 (Ranks #2-10 - Top Signaller)
   * Tier 3: 🌟 (Ranks #11-50 - Rising Star)
   * Tier 4: 📈 (Ranks #51-100 - Developing)
   * Tier 5: 📍 (Ranks #101+ - Participant)
   */
  // change these icons to match better images
  getTierBadge(rank: number): string {
    if (rank === 1) return '🥇';
    if (rank >= 2 && rank <= 10) return '🥈';
    if (rank >= 11 && rank <= 50) return '🌟';
    if (rank >= 51 && rank <= 100) return '📈';
    return '📍';
  }

  /**
   * Get CSS tier class for gradient backgrounds and styling
   */
  getTierClass(rank: number): string {
    if (rank === 1) return 'tier-1';
    if (rank >= 2 && rank <= 10) return 'tier-2';
    if (rank >= 11 && rank <= 50) return 'tier-3';
    if (rank >= 51 && rank <= 100) return 'tier-4';
    return 'tier-5';
  }

  /**
   * Get special border accent for top performers
   * Rank #1: Gold border
   * Ranks #2-10: Silver/blue border
   */
  getTopBorderClass(rank: number): string {
    if (rank === 1) return 'top-1-border';
    if (rank >= 2 && rank <= 10) return 'top-10-border';
    return '';
  }

  /**
   * Get gamified achievement label for each tier
   */
  getTierLabel(rank: number): string {
    if (rank === 1) return 'Achieved Rank: Signals Master ⭐';
    if (rank >= 2 && rank <= 10) return 'Achieved Rank: Top Signaller';
    if (rank >= 11 && rank <= 50) return `Rising Star — Rank #${rank}`;
    if (rank >= 51 && rank <= 100) return `Developing — Rank #${rank}`;
    return `Participant — Rank #${rank}`;
  }

  /**
   * Check if this entry is the current user (from localStorage)
   */
  isCurrentUser(username: string): boolean {
    return this.currentUsername !== null && this.currentUsername === username;
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Navigate to Compete tab (Best Signaller competition mode entry)
   */
  navigateToCompete(): void {
    this.router.navigate(['/tabs/best-signaller']);
  }
}
