import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonText, IonIcon } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { PracticeSummary } from '../../core/services/quiz.service';
import { PracticeResultsService } from '../../core/services/practice-results.service';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';

/**
 * PracticeResultsPage displays the results of a practice quiz session.
 * MVP Phase 2: Handles result display, auto-submission to Firestore, and navigation logic.
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
   * Authenticated user for results submission.
   */
  currentUser: User | null = null;
  /**
   * Indicates if a submission is in progress.
   */
  isSubmitting = false;
  /**
   * Indicates if results have been submitted.
   */
  hasSubmitted = false;
  /**
   * Message describing submission status or errors.
   */
  submissionMessage = '';
  /**
   * Indicates if submission was successful.
   */
  submissionSuccess = false;

  /**
   * Injects router, practice results service, and auth service.
   */
  constructor(
    private readonly router: Router,
    private readonly practiceResultsService: PracticeResultsService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    // Get authenticated user
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      console.error('[PracticeResultsPage] No authenticated user');
      this.router.navigate(['/registration']);
      return;
    }

    // Use history.state instead of getCurrentNavigation (deprecated)
    this.summary = history.state['summary'] ?? null;

    if (!this.summary) {
      // Redirect to home if no results available
      console.log('[PracticeResultsPage] No summary data in navigation state');
      this.router.navigate(['/tabs/home']);
      return;
    }

    // Auto-submit results on page load (MVP Phase 2)
    this.submitResults();
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

  /**
   * Submit practice results to Firestore.
   * Auto-called on page load. Can be manually retried on error.
   */
  async submitResults(): Promise<void> {
    if (!this.summary || !this.currentUser) {
      console.error('[PracticeResultsPage] Cannot submit without summary or user');
      return;
    }

    // Prevent duplicate submissions
    if (this.isSubmitting || this.hasSubmitted) {
      console.log('[PracticeResultsPage] Submission already in progress or completed');
      return;
    }

    this.isSubmitting = true;
    this.submissionMessage = '';

    console.log('[PracticeResultsPage] Submitting practice results...', {
      userId: this.currentUser.user_id,
      sessionId: this.summary.sessionId,
      score: this.summary.correctAnswers
    });

    try {
      const response = await this.practiceResultsService.submitPracticeResult(
        this.currentUser,
        this.summary
      );

      this.isSubmitting = false;

      if (response.success) {
        this.hasSubmitted = true;
        this.submissionSuccess = true;
        this.submissionMessage = 'Practice results saved successfully!';
        console.log('[PracticeResultsPage] Results submitted successfully:', response.resultId);
      } else {
        this.submissionSuccess = false;
        this.submissionMessage = response.message || 'Failed to save results';
        console.error('[PracticeResultsPage] Submission failed:', response.message);
      }
    } catch (error: any) {
      this.isSubmitting = false;
      this.submissionSuccess = false;
      this.submissionMessage = 'Network error. Please try again.';
      console.error('[PracticeResultsPage] Submission error:', error);
    }
  }

  /**
   * Retry submission after an error.
   * Resets submission state and attempts to submit again.
   */
  retrySubmission(): void {
    console.log('[PracticeResultsPage] Retrying submission...');
    this.hasSubmitted = false;
    this.isSubmitting = false;
    this.submissionMessage = '';
    this.submitResults();
  }

  tryAgain(): void {
    this.router.navigate(['/tabs/practice-mode']);
  }

  viewHistory(): void {
    this.router.navigate(['/practice-history']);
  }

  goHome(): void {
    this.router.navigate(['/tabs/home']);
  }
}
