import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonIcon, IonAccordionGroup, IonAccordion, IonItem, IonLabel } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { APP_VERSION } from '../../config/app-version';

/**
 * AboutPage displays app information and feedback options.
 * Provides access to version info and external feedback link.
 * Icons are registered centrally in app.component.ts (Issue #227 fix)
 */
@Component({
  selector: 'app-about',
  templateUrl: './about.page.html',
  styleUrls: ['./about.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonIcon, IonAccordionGroup, IonAccordion, IonItem, IonLabel, CommonModule]
})
export class AboutPage {
  /**
   * Current app version for display.
   */
  appVersion = APP_VERSION;

  /**
   * Opens feedback form in a new tab and triggers haptic feedback if available.
   */
  async navigateToFeedback(): Promise<void> {
    try {
      await Haptics.impact({ style: ImpactStyle.Light }); // Provide tactile feedback
    } catch (err) {
      // Haptics not available (web or unsupported device)
    } // added new feedback platform link
    window.open('https://signalsmaster.userjot.com/', '_blank', 'noopener,noreferrer');
  }
}

