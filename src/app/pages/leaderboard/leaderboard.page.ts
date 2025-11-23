import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { LeaderboardService, LeaderboardEntry } from '../../core/services/leaderboard.service';

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.page.html',
  styleUrls: ['./leaderboard.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, CommonModule]
})
export class LeaderboardPage implements OnInit, OnDestroy {
  entries: LeaderboardEntry[] = [];
  private leaderboardSubscription: Subscription | null = null;

  constructor(private leaderboardService: LeaderboardService) {}

  ngOnInit(): void {
    console.log('[DEBUG] LeaderboardPage.ngOnInit() called');
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

  getRankIcon(rank: number): string {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  }

  getRankClass(rank: number): string {
    if (rank === 1) return 'bg-yellow-100 border-yellow-400';
    if (rank === 2) return 'bg-gray-100 border-gray-400';
    if (rank === 3) return 'bg-orange-100 border-orange-400';
    return 'bg-white border-gray-200';
  }

  formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}
