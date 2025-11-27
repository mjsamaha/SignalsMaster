import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonItem, IonLabel } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
/**
 * PracticeModePage allows users to select the number of questions and start a practice quiz.
 * Handles navigation to the quiz page with selected settings.
 */
@Component({
  selector: 'app-practice-mode',
  templateUrl: './practice-mode.page.html',
  styleUrls: ['./practice-mode.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonItem, IonLabel, CommonModule, FormsModule]
})
export class PracticeModePage {
  /**
   * Number of questions for the practice session.
   */
  questionCount: number = 10;

  /**
   * Injects router for navigation.
   */
  constructor(private router: Router) {}

  /**
   * Navigates to quiz page with selected question count in practice mode.
   */
  startPractice(): void {
    this.router.navigate(['/quiz'], {
      queryParams: {
        mode: 'practice',
        count: this.questionCount
      }
    });
  }
}

