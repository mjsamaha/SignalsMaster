
import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonIcon } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { addIcons } from 'ionicons';
import { chatbubblesOutline } from 'ionicons/icons';
import { APP_VERSION } from '../../config/app-version';

/**
 * AboutPage displays app information and feedback options.
 * Provides access to version info and external feedback link.
 */
@Component({
  selector: 'app-about',
  templateUrl: './about.page.html',
  styleUrls: ['./about.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonIcon, CommonModule]
})
export class AboutPage {
  /**
   * Current app version for display.
   */
  appVersion = APP_VERSION;

  /**
   * Initializes AboutPage and sets up icons.
   */
  constructor() {
    addIcons({ chatbubblesOutline });
  }

  /**
   * Opens feedback form in a new tab and triggers haptic feedback if available.
   */
  async navigateToFeedback(): Promise<void> {
    try {
      await Haptics.impact({ style: ImpactStyle.Light }); // Provide tactile feedback
    } catch (err) {
      // Haptics not available (web or unsupported device)
    }
    window.open('https://signalsmaster.sleekplan.app', '_blank', 'noopener,noreferrer');
  }
}

