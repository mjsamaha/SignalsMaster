
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { addIcons } from 'ionicons';
import { chatbubblesOutline } from 'ionicons/icons';

/**
 * HomePage serves as the main entry point for the app.
 * Provides navigation to practice, competitive, leaderboard, and feedback features.
 */
@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, CommonModule]
})
export class HomePage {
  /**
   * Injects router for navigation and sets up icons.
   */
  constructor(private router: Router) {
    addIcons({ chatbubblesOutline });
  }

  /**
   * Navigates to practice mode tab with haptic feedback.
   */
  async navigateToPracticeMode(): Promise<void> {
    await this.triggerHaptic();
    this.router.navigate(['/tabs/practice-mode']);
  }

  /**
   * Navigates to best signaller tab with haptic feedback.
   */
  async navigateToBestSignaller(): Promise<void> {
    await this.triggerHaptic();
    this.router.navigate(['/tabs/best-signaller']);
  }

  /**
   * Navigates to leaderboard tab with haptic feedback.
   */
  async navigateToLeaderboard(): Promise<void> {
    await this.triggerHaptic();
    this.router.navigate(['/tabs/leaderboard']);
  }

  /**
   * Starts a practice quiz with the specified question count.
   */
  async startPractice(questionCount: number) {
    await this.triggerHaptic();
    this.router.navigate(['/quiz'], {
      queryParams: {
        mode: 'practice',
        count: questionCount
      }
    });
  }

  /**
   * Starts a competitive quiz session.
   */
  async startBestSignaller() {
    await this.triggerHaptic();
    this.router.navigate(['/quiz'], {
      queryParams: {
        mode: 'competitive'
      }
    });
  }

  /**
   * Opens feedback form in a new tab with haptic feedback.
   */
  async navigateToFeedback(): Promise<void> {
    await this.triggerHaptic();
    // added new feedback link
    window.open('https://signalsmaster.userjot.com/', '_blank', 'noopener,noreferrer');
  }

  private async triggerHaptic(): Promise<void> {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (err) {
      // Haptics not available (web or unsupported device)
    }
  }
}

