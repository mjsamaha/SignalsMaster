import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonText, IonIcon } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { PracticeSummary } from '../../core/services/quiz.service';

/**
 * PracticeResultsPage displays the results of a practice quiz session.
 * Handles motivational messaging, time formatting, and navigation logic.
 */
@Component({
  selector: 'app-practice-results',
  templateUrl: './practice-results.page.html',
  styleUrls: ['./practice-results.page.scss'],
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
export class PracticeResultsPage implements OnInit {
  /**
   * Stores the summary of the practice session for display.
   */
  summary: PracticeSummary | null = null;
  /**
   * Controls whether all questions are shown in the UI.
   */
  showAllQuestions = false;

  /**
   * Injects router.
   */
  constructor(private readonly router: Router) {}

  ngOnInit(): void {
    // Use history.state instead of getCurrentNavigation (deprecated)
    this.summary = history.state['summary'] ?? null;

    if (!this.summary) {
      // Redirect to home if no results available
      this.router.navigate(['/tabs/home']);
    }
  }

  /**
   * Returns a motivational message based on user accuracy.
   */
  getMotivationalMessage(): string {
    if (!this.summary) return '';

    const accuracy = this.summary.accuracy;
    if (accuracy >= 90) {
      return 'Excellent work! You\'re a flag signaling expert!';
    } else if (accuracy >= 75) {
      return 'Great job! Keep practicing to master all the flags!';
    } else if (accuracy >= 50) {
      return 'Good progress! Continue practicing to improve!';
    } else {
      return 'Keep practicing! Every expert was once a beginner!';
    }
  }

  /**
   * Formats seconds into mm:ss string for display.
   */
  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Returns color string for accuracy badge based on score.
   */
  getAccuracyColor(): string {
    if (!this.summary) return 'medium';

    const accuracy = this.summary.accuracy;
    if (accuracy >= 75) return 'success';
    if (accuracy >= 50) return 'warning';
    return 'danger';
  }

  getPerformanceTier(): 'excellent' | 'good' | 'fair' | 'poor' {
    if (!this.summary) return 'fair';

    const accuracy = this.summary.accuracy;
    if (accuracy >= 90) return 'excellent';
    if (accuracy >= 70) return 'good';
    if (accuracy >= 50) return 'fair';
    return 'poor';
  }

  getPerformanceBadge(): string {
    const tier = this.getPerformanceTier();
    const badges = {
      excellent: '⭐ Excellent',
      good: '👍 Good Job',
      fair: '📈 Keep Going',
      poor: '💪 Keep Practicing'
    };
    return badges[tier];
  }

  getVisibleQuestions() {
    if (!this.summary) return [];
    return this.showAllQuestions
      ? this.summary.answers
      : this.summary.answers.slice(0, 5);
  }

  toggleShowAllQuestions(): void {
    this.showAllQuestions = !this.showAllQuestions;
  }

  tryAgain(): void {
    this.router.navigate(['/tabs/practice-mode']);
  }

  goHome(): void {
    this.router.navigate(['/tabs/home']);
  }
}
