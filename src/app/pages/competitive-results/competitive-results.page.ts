import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonText, IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonBadge, IonProgressBar, IonGrid, IonRow, IonCol } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { CompetitiveResults } from '../../core/services/quiz.service';
import { LeaderboardService } from '../../core/services/leaderboard.service';

@Component({
  selector: 'app-competitive-results',
  templateUrl: './competitive-results.page.html',
  styleUrls: ['./competitive-results.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonText,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonBadge,
    IonProgressBar,
    IonGrid,
    IonRow,
    IonCol
]
})
export class CompetitiveResultsPage implements OnInit {
  results: CompetitiveResults | null = null;
  isSubmitting = false;
  hasSubmitted = false;
  submissionMessage = '';
  submissionSuccess = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private leaderboardService: LeaderboardService
  ) {}

  ngOnInit() {
    // Extract results from router state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.results = navigation.extras.state['results'] as CompetitiveResults;
    }

    // Fallback: redirect back if no results
    if (!this.results) {
      this.router.navigate(['/best-signaller']);
    }
  }

  getRatingColor(): string {
    if (!this.results) return 'medium';
    const rating = this.results.finalRating;
    if (rating >= 90) return 'success'; // Green
    if (rating >= 70) return 'warning'; // Yellow/Orange
    return 'danger'; // Red
  }

  getRatingTierColor(): string {
    if (!this.results) return 'medium';
    switch (this.results.ratingTier) {
      case 'Signals Master': return 'success';
      case 'Expert Signaller': return 'success';
      case 'Advanced Operator': return 'warning';
      case 'Competent Handler': return 'warning';
      case 'Developing Skill': return 'danger';
      case 'Keep Practicing': return 'danger';
      default: return 'medium';
    }
  }

  getSpeedComparison(): string {
    if (!this.results) return '';
    const benchmarkTime = 175; // 3.5 seconds per question
    const userTime = this.results.totalTime;
    const difference = userTime - benchmarkTime;
    const percentage = Math.abs((difference / benchmarkTime) * 100);

    if (difference === 0) return 'Right on time!';
    if (difference < 0) {
      return `You were ${percentage.toFixed(0)}% faster than average`;
    } else {
      return `You were ${percentage.toFixed(0)}% slower than average`;
    }
  }

  getMotivationalMessage(): string {
    if (!this.results) return '';

    const tier = this.results.ratingTier;
    const rating = this.results.finalRating;

    if (rating >= 90) {
      return 'Outstanding performance! You are a true Signals Master!';
    } else if (rating >= 70) {
      return 'Excellent work! Keep building on this strong foundation.';
    } else if (rating >= 50) {
      return 'Good progress! Focus on both speed and accuracy to reach the next level.';
    } else {
      return 'Keep practicing! Consistent effort will lead to improvement.';
    }
  }

  getFlagImagePath(flagId: string): string {
    // This would normally be retrieved from FlagService,
    // but for simplicity in results display, we'll use a generic approach
    return `assets/flags/${flagId.includes('-') ?
      `special-pennants/${flagId}` :
      flagId.includes('p') ?
        `pennnant-numbers/${flagId}` :
        flagId.length === 1 ?
          `letters/${flagId}.png` :
          `flags/${flagId}`}`;
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  tryAgain(): void {
    this.router.navigate(['/best-signaller']);
  }

  viewLeaderboard(): void {
    // TODO: Navigate to leaderboard page (Milestone 5)
    // For now, navigate to home or placeholder
    this.router.navigate(['/tabs/leaderboard']);
  }

  goHome(): void {
    this.router.navigate(['/tabs/home']);
  }

  async submitScore(): Promise<void> {
    if (!this.results || this.isSubmitting) return;

    this.isSubmitting = true;
    this.submissionMessage = '';

    try {
      const response = await this.leaderboardService.submitScore(this.results);
      this.isSubmitting = false;

      if (response.success) {
        this.hasSubmitted = true;
        this.submissionSuccess = true;
        this.submissionMessage = response.message;
      } else {
        this.submissionSuccess = false;
        this.submissionMessage = response.message || 'Failed to submit score';
      }
    } catch (error) {
      this.isSubmitting = false;
      this.submissionSuccess = false;
      this.submissionMessage = 'Network error. Please try again.';
      console.error('Submission error:', error);
    }
  }
}
