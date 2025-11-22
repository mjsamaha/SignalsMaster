import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonText, IonIcon } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { PracticeSummary } from '../../core/services/quiz.service';

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
export class PracticeResultsPage {
  summary: PracticeSummary | null = null;

  constructor(private router: Router) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.summary = navigation.extras.state['summary'];
    }

    if (!this.summary) {
      // Redirect to home if no results available
      this.router.navigate(['/tabs/home']);
    }
  }

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

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  getAccuracyColor(): string {
    if (!this.summary) return 'medium';

    const accuracy = this.summary.accuracy;
    if (accuracy >= 75) return 'success';
    if (accuracy >= 50) return 'warning';
    return 'danger';
  }

  tryAgain(): void {
    this.router.navigate(['/tabs/practice-mode']);
  }

  goHome(): void {
    this.router.navigate(['/tabs/home']);
  }
}
