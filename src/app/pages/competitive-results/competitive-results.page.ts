import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonText, IonIcon } from '@ionic/angular/standalone';
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
    IonIcon
]
})
export class CompetitiveResultsPage implements OnInit, AfterViewInit {
  results: CompetitiveResults | null = null;
  isSubmitting = false;
  hasSubmitted = false;
  submissionMessage = '';
  submissionSuccess = false;
  showAllQuestions = false;
  Math = Math;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private leaderboardService: LeaderboardService
  ) {}

  ngOnInit() {
    // Extract results from router navigation state
    const navigation = this.router.getCurrentNavigation();

    if (navigation?.extras?.state && navigation.extras.state['results']) {
      this.results = navigation.extras.state['results'] as CompetitiveResults;
    } else {
      this.router.navigate(['/best-signaller']);
    }
  }

  ngAfterViewInit() {}

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

    const rating = this.results.finalRating;

    if (rating >= 90) {
      return 'Outstanding performance! You are a true Signals Master!';
    } else if (rating >= 70) {
      return 'Excellent work! Keep building on this strong foundation.';
    } else if (rating >= 50) {
      return 'Good progress! Focus on both speed and accuracy to reach the next level.';
    } else {
      return 'Focus on accuracy to reach the next level';
    }
  }

  getPerformanceEmoji(): string {
    if (!this.results) return '🏅';
    const rating = this.results.finalRating;
    if (rating >= 90) return '🏆';
    if (rating >= 70) return '⭐';
    if (rating >= 50) return '🎖️';
    return '🏅';
  }

  getPerformanceTier(): string {
    if (!this.results) return 'Developing Skill';
    const rating = this.results.finalRating;
    if (rating >= 90) return 'Excellent';
    if (rating >= 70) return 'Good';
    if (rating >= 50) return 'Fair';
    return 'Developing Skill';
  }

  getDisplayedQuestions() {
    if (!this.results) return [];
    return this.showAllQuestions ? this.results.answers : this.results.answers.slice(0, 5);
  }

  toggleQuestions() {
    this.showAllQuestions = !this.showAllQuestions;
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
    if (!this.results || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.submissionMessage = '';

    try {
      const response = await this.leaderboardService.submitScore(this.results);
      this.isSubmitting = false;

      if (response.success) {
        this.hasSubmitted = true;
        this.submissionSuccess = true;
        this.submissionMessage = 'Score submitted successfully!';
      } else {
        this.submissionSuccess = false;
        this.submissionMessage = response.message || 'Failed to submit score';
      }
    } catch (error) {
      this.isSubmitting = false;
      this.submissionSuccess = false;
      this.submissionMessage = 'Network error. Please try again.';
    }
  }

  tryAgain(): void {
    this.router.navigate(['/best-signaller']);
  }

  viewLeaderboard(): void {
    this.router.navigate(['/tabs/leaderboard']);
  }

  goHome(): void {
    this.router.navigate(['/tabs/home']);
  }
}
