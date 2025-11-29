import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { LeaderboardService, LeaderboardEntry } from '../../core/services/leaderboard.service';

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.page.html',
  styleUrls: ['./leaderboard.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, CommonModule]
})
export class LeaderboardPage implements OnInit, OnDestroy {
  entries: LeaderboardEntry[] = [];
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

    this.leaderboardSubscription = this.leaderboardService.getLeaderboard().subscribe({
      next: entries => {
        console.log('[DEBUG] Leaderboard received entries:', entries.length, 'entries:', entries);
        this.entries = entries;
      },
      error: error => {
        console.error('[DEBUG] Failed to load leaderboard:', error);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.leaderboardSubscription) {
      this.leaderboardSubscription.unsubscribe();
    }
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
