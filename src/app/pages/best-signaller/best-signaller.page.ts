import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

/**
 * BestSignallerPage allows authenticated users to start a competitive quiz.
 * Authentication is handled by authGuard, so user is guaranteed to be logged in.
 */
@Component({
  selector: 'app-best-signaller',
  templateUrl: './best-signaller.page.html',
  styleUrls: ['./best-signaller.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, CommonModule]
})
export class BestSignallerPage {
  /**
   * Injects router for navigation.
   */
  constructor(private router: Router) {}

  /**
   * Navigates to the competitive quiz.
   * User is authenticated via authGuard.
   */
  startCompetition(): void {
    this.router.navigate(['/quiz', 'competitive']);
  }
}
