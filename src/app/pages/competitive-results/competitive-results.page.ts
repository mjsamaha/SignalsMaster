import { Component, OnInit, AfterViewInit } from '@angular/core';
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
export class CompetitiveResultsPage implements OnInit, AfterViewInit {
  results: CompetitiveResults | null = null;
  isSubmitting = false;
  hasSubmitted = false;
  submissionMessage = '';
  submissionSuccess = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private leaderboardService: LeaderboardService
  ) {
    console.log('[DEBUG] CompetitiveResultsPage CONSTRUCTOR called');
  }

  ngOnInit() {
    console.log('[DEBUG] CompetitiveResultsPage.ngOnInit() called');

    // Extract results from router navigation state
    const navigation = this.router.getCurrentNavigation();
    console.log('[DEBUG] getCurrentNavigation result:', !!navigation, 'has state:', !!navigation?.extras?.state);

    if (navigation?.extras?.state && navigation.extras.state['results']) {
      this.results = navigation.extras.state['results'] as CompetitiveResults;
      console.log('[DEBUG] ✓ Results extracted successfully:', {
        username: this.results.username,
        finalRating: this.results.finalRating,
        accuracy: this.results.accuracy,
        totalTime: this.results.totalTime,
        sessionId: this.results.sessionId
      });
    } else {
      console.log('[DEBUG] ✗ No results found in navigation state');
      console.log('[DEBUG] Navigation extras:', navigation?.extras);
      console.log('[DEBUG] Attempting redirect to best-signaller');
      this.router.navigate(['/best-signaller']);
    }
  }

  ngAfterViewInit() {
    console.log('[DEBUG] CompetitiveResultsPage.ngAfterViewInit() called');
    console.log('[DEBUG] Button should be visible - hasSubmitted:', this.hasSubmitted, 'isSubmitting:', this.isSubmitting);
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

  async submitScore(): Promise<void> {
    console.log('[DEBUG] submitScore() called, results:', this.results, 'isSubmitting:', this.isSubmitting);
    if (!this.results || this.isSubmitting) {
      console.log('[DEBUG] Early return: results null or already submitting', { results: this.results, isSubmitting: this.isSubmitting });
      return;
    }

    console.log('[DEBUG] Proceeding with score submission...');
    console.log('[DEBUG] Results object details:', {
      username: this.results.username,
      finalRating: this.results.finalRating,
      accuracy: this.results.accuracy,
      totalTime: this.results.totalTime,
      sessionId: this.results.sessionId,
      correctAnswers: this.results.correctAnswers,
      totalQuestions: this.results.totalQuestions
    });

    this.isSubmitting = true;
    this.submissionMessage = '';

    try {
      console.log('[DEBUG] Calling leaderboardService.submitScore...');
      const response = await this.leaderboardService.submitScore(this.results);
      console.log('[DEBUG] submitScore response:', response);
      this.isSubmitting = false;

      if (response.success) {
        console.log('[DEBUG] Submission successful');
        this.hasSubmitted = true;
        this.submissionSuccess = true;
        this.submissionMessage = response.message;
      } else {
        console.log('[DEBUG] Submission failed:', response.message);
        this.submissionSuccess = false;
        this.submissionMessage = response.message || 'Failed to submit score';
      }
    } catch (error) {
      console.log('[DEBUG] Caught exception in submitScore:', error);
      this.isSubmitting = false;
      this.submissionSuccess = false;
      this.submissionMessage = 'Network error. Please try again.';
      console.error('Submission error:', error);
    }
  }

  tryAgain(): void {
    console.log('[DEBUG] tryAgain() called');
    this.router.navigate(['/best-signaller']);
  }

  viewLeaderboard(): void {
    console.log('[DEBUG] viewLeaderboard() called');
    this.router.navigate(['/tabs/leaderboard']);
  }

  goHome(): void {
    console.log('[DEBUG] goHome() called');
    this.router.navigate(['/tabs/home']);
  }
}
