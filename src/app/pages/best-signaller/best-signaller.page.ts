import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonInput, IonItem, IonLabel } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-best-signaller',
  templateUrl: './best-signaller.page.html',
  styleUrls: ['./best-signaller.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonInput, IonItem, IonLabel, CommonModule, FormsModule]
})
export class BestSignallerPage {
  username: string = '';
  questionCount: number = 10;

  constructor(private router: Router) {}

  startCompetition(): void {
    if (this.username.trim()) {
      this.router.navigate(['/quiz'], {
        queryParams: {
          mode: 'competition',
          username: this.username.trim(),
          count: this.questionCount
        }
      });
    }
  }
}

