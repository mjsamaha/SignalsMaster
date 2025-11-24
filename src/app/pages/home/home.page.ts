import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { Haptics, ImpactStyle } from '@capacitor/haptics';



@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, CommonModule]
})
export class HomePage {
  constructor(private router: Router) {}

  async navigateToPracticeMode(): Promise<void> {
    await this.triggerHaptic();
    this.router.navigate(['/tabs/practice-mode']);
  }

  async navigateToBestSignaller(): Promise<void> {
    await this.triggerHaptic();
    this.router.navigate(['/tabs/best-signaller']);
  }

  async navigateToLeaderboard(): Promise<void> {
    await this.triggerHaptic();
    this.router.navigate(['/tabs/leaderboard']);
  }

  async startPractice(questionCount: number) {
    await this.triggerHaptic();
    this.router.navigate(['/quiz'], {
      queryParams: {
        mode: 'practice',
        count: questionCount
      }
    });
  }

  async startBestSignaller() {
    await this.triggerHaptic();
    this.router.navigate(['/quiz'], {
      queryParams: {
        mode: 'competitive'
      }
    });
  }

  private async triggerHaptic(): Promise<void> {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (err) {
      // Haptics not available (web or unsupported device)
    }
  }
}

