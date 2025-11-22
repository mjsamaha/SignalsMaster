import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, CommonModule]
})
export class HomePage {
  constructor(private router: Router) {}

  navigateToPracticeMode(): void {
    this.router.navigate(['/tabs/practice-mode']);
  }

  navigateToBestSignaller(): void {
    this.router.navigate(['/tabs/best-signaller']);
  }

  navigateToLeaderboard(): void {
    this.router.navigate(['/tabs/leaderboard']);
  }
}

