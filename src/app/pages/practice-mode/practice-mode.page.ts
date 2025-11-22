import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonItem, IonLabel } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-practice-mode',
  templateUrl: './practice-mode.page.html',
  styleUrls: ['./practice-mode.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonItem, IonLabel, CommonModule, FormsModule]
})
export class PracticeModePage {
  questionCount: number = 10;

  constructor(private router: Router) {}

  startPractice(): void {
    this.router.navigate(['/quiz'], {
      queryParams: {
        mode: 'practice',
        count: this.questionCount
      }
    });
  }
}

